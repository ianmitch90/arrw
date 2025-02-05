import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, Input, Tabs, Tab, Card, CardBody, Button, Avatar } from '@nextui-org/react';
import { Search, MapPin, Users, Coffee, Navigation } from 'lucide-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types_db';
import { motion, AnimatePresence } from 'framer-motion';

type SearchResult = {
  id: string;
  name?: string;
  display_name?: string;
  description?: string;
  bio?: string;
  type: 'user' | 'place' | 'group';
  avatar_url?: string;
  location: any; // PostGIS point
  distance?: number;
};

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: { latitude: number; longitude: number };
}

export function SearchOverlay({ isOpen, onClose, currentLocation }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient<Database>();

  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setIsLoading(true);
      try {
        // Search users
        const { data: users, error: usersError } = await supabase
          .rpc('search_users_with_distance', {
            search_query: searchQuery,
            user_lat: currentLocation?.latitude || 38.8977,
            user_lng: currentLocation?.longitude || -77.0365
          });

        // Search places
        const { data: places, error: placesError } = await supabase
          .rpc('search_places_with_distance', {
            search_query: searchQuery,
            user_lat: currentLocation?.latitude || 38.8977,
            user_lng: currentLocation?.longitude || -77.0365
          });

        // Search groups
        const { data: groups, error: groupsError } = await supabase
          .rpc('search_groups_with_distance', {
            search_query: searchQuery,
            user_lat: currentLocation?.latitude || 38.8977,
            user_lng: currentLocation?.longitude || -77.0365
          });

        if (usersError || placesError || groupsError) {
          console.error('Search error:', { usersError, placesError, groupsError });
          return;
        }

        const formattedResults = [
          ...(users?.map(u => ({ ...u, type: 'user' as const })) || []),
          ...(places?.map(p => ({ ...p, type: 'place' as const })) || []),
          ...(groups?.map(g => ({ ...g, type: 'group' as const })) || [])
        ].sort((a, b) => (a.distance || 0) - (b.distance || 0));

        setResults(formattedResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentLocation, supabase]);

  const filteredResults = activeTab === 'all' 
    ? results 
    : results.filter(r => r.type === activeTab);

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'place':
        return <MapPin className="w-4 h-4" />;
      case 'group':
        return <Coffee className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "h-[80vh]",
        backdrop: "backdrop-blur-sm",
        body: "p-0"
      }}
    >
      <ModalContent>
        <ModalBody>
          <div className="sticky top-0 z-10 bg-background pt-4 pb-2 px-4">
            <Input
              autoFocus
              placeholder="Search users, places, and groups..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              size="lg"
              classNames={{
                input: "h-12"
              }}
            />
          </div>

          <Tabs 
            selectedKey={activeTab}
            onSelectionChange={setActiveTab as any}
            variant="underlined"
            classNames={{
              tabList: "px-4 w-full",
              cursor: "bg-primary",
              tab: "px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            <Tab key="all" title="All" />
            <Tab key="user" title="Users" />
            <Tab key="place" title="Places" />
            <Tab key="group" title="Groups" />
          </Tabs>

          <AnimatePresence>
            <div className="px-4 py-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="space-y-2">
                  {filteredResults.map((result) => (
                    <motion.div
                      key={`${result.type}-${result.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card
                        isPressable
                        className="w-full"
                        onPress={() => {
                          // TODO: Navigate to result
                          onClose();
                        }}
                      >
                        <CardBody className="flex flex-row items-center gap-4 p-4">
                          <Avatar
                            src={result.avatar_url}
                            name={result.name || result.display_name}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {getIcon(result.type)}
                              <p className="font-semibold truncate">
                                {result.name || result.display_name}
                              </p>
                            </div>
                            <p className="text-sm text-default-500 truncate">
                              {result.description || result.bio}
                            </p>
                          </div>
                          {result.distance && (
                            <div className="flex items-center gap-1 text-sm text-default-500">
                              <Navigation className="w-3 h-3" />
                              <span>{result.distance.toFixed(1)}mi</span>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : searchQuery.length > 1 ? (
                <div className="text-center py-8 text-default-500">
                  No results found
                </div>
              ) : null}
            </div>
          </AnimatePresence>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
