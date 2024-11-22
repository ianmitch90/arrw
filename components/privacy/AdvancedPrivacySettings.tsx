import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Switch,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  useDisclosure,
} from '@nextui-org/react';
import { Shield, Clock, Users, Trash2, Plus } from 'lucide-react';

type PrivacyLevel = 'precise' | 'approximate' | 'area';
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface PrivacySchedule {
  day: DayOfWeek;
  start_time: number; // minutes from midnight
  end_time: number; // minutes from midnight
  privacy_level: PrivacyLevel;
}

interface PrivacyRules {
  strangers: Exclude<PrivacyLevel, 'precise'>;
  authenticated: PrivacyLevel;
  trusted: PrivacyLevel;
  schedule_enabled: boolean;
}

interface TrustedContact {
  id: string;
  contact_id: string;
  trust_level: PrivacyLevel;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface PrivacyStats {
  total_trusted_contacts: number;
  precise_locations_shared: number;
  location_requests_received: number;
  average_obscuring_radius: number;
}

export function AdvancedPrivacySettings() {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [schedule, setSchedule] = useState<PrivacySchedule[]>([]);
  const [rules, setRules] = useState<PrivacyRules>({
    strangers: 'area',
    authenticated: 'approximate',
    trusted: 'precise',
    schedule_enabled: false,
  });
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
      fetchTrustedContacts();
      fetchPrivacyStats();
    }
  }, [user]);

  const fetchPrivacySettings = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('privacy_schedule, default_privacy_rules')
      .eq('id', user!.id)
      .single();

    if (profile) {
      setSchedule(profile.privacy_schedule);
      setRules(profile.default_privacy_rules);
    }
  };

  const fetchTrustedContacts = async () => {
    const { data } = await supabase
      .from('trusted_contacts')
      .select(`
        id,
        contact_id,
        trust_level,
        contact:profiles!contact_id (
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user!.id);

    if (data) {
      setTrustedContacts(data as unknown as TrustedContact[]);
    }
  };

  const fetchPrivacyStats = async () => {
    const { data } = await supabase.rpc('get_privacy_stats');
    if (data) {
      setStats(data as PrivacyStats);
    }
  };

  const updatePrivacyRules = async (newRules: Partial<PrivacyRules>) => {
    const updatedRules = { ...rules, ...newRules };
    const { error } = await supabase.rpc('update_privacy_rules', {
      p_rules: updatedRules,
    });

    if (!error) {
      setRules(updatedRules);
    }
  };

  const updateSchedule = async (newSchedule: PrivacySchedule[]) => {
    const { error } = await supabase.rpc('update_privacy_schedule', {
      p_schedule: newSchedule,
    });

    if (!error) {
      setSchedule(newSchedule);
    }
  };

  const addTrustedContact = async (contactId: string, trustLevel: PrivacyLevel) => {
    const { error } = await supabase.rpc('manage_trusted_contact', {
      p_contact_id: contactId,
      p_trust_level: trustLevel,
    });

    if (!error) {
      fetchTrustedContacts();
      fetchPrivacyStats();
    }
  };

  const removeTrustedContact = async (contactId: string) => {
    const { error } = await supabase.rpc('remove_trusted_contact', {
      p_contact_id: contactId,
    });

    if (!error) {
      fetchTrustedContacts();
      fetchPrivacyStats();
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getDayName = (day: DayOfWeek) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
  };

  return (
    <div className="space-y-6">
      {/* Privacy Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold">{stats.total_trusted_contacts}</div>
              <div className="text-small text-default-500">Trusted Contacts</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold">{stats.precise_locations_shared}</div>
              <div className="text-small text-default-500">Precise Locations Shared</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold">{stats.location_requests_received}</div>
              <div className="text-small text-default-500">Location Requests</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold">{stats.average_obscuring_radius}m</div>
              <div className="text-small text-default-500">Avg. Privacy Radius</div>
            </CardBody>
          </Card>
        </div>
      )}

      <Accordion>
        {/* Default Privacy Rules */}
        <AccordionItem
          key="rules"
          aria-label="Default Privacy Rules"
          startContent={<Shield className="w-5 h-5" />}
          title="Default Privacy Rules"
        >
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <label className="text-small font-medium">Strangers</label>
              <Select
                value={rules.strangers}
                onChange={e => updatePrivacyRules({ strangers: e.target.value as Exclude<PrivacyLevel, 'precise'> })}
              >
                <SelectItem key="approximate" value="approximate">Approximate Location</SelectItem>
                <SelectItem key="area" value="area">General Area</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-small font-medium">Authenticated Users</label>
              <Select
                value={rules.authenticated}
                onChange={e => updatePrivacyRules({ authenticated: e.target.value as PrivacyLevel })}
              >
                <SelectItem key="precise" value="precise">Precise Location</SelectItem>
                <SelectItem key="approximate" value="approximate">Approximate Location</SelectItem>
                <SelectItem key="area" value="area">General Area</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-small font-medium">Trusted Contacts (Default)</label>
              <Select
                value={rules.trusted}
                onChange={e => updatePrivacyRules({ trusted: e.target.value as PrivacyLevel })}
              >
                <SelectItem key="precise" value="precise">Precise Location</SelectItem>
                <SelectItem key="approximate" value="approximate">Approximate Location</SelectItem>
                <SelectItem key="area" value="area">General Area</SelectItem>
              </Select>
            </div>
          </div>
        </AccordionItem>

        {/* Privacy Schedule */}
        <AccordionItem
          key="schedule"
          aria-label="Privacy Schedule"
          startContent={<Clock className="w-5 h-5" />}
          title="Privacy Schedule"
        >
          <div className="space-y-4 p-4">
            <Switch
              checked={rules.schedule_enabled}
              onChange={e => updatePrivacyRules({ schedule_enabled: e.target.checked })}
            >
              Enable Privacy Schedule
            </Switch>

            {rules.schedule_enabled && (
              <>
                <Button
                  size="sm"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={() => {
                    const newSchedule = [...schedule, {
                      day: 0,
                      start_time: 0,
                      end_time: 1440,
                      privacy_level: 'area',
                    }];
                    updateSchedule(newSchedule);
                  }}
                >
                  Add Schedule
                </Button>

                <Table>
                  <TableHeader>
                    <TableColumn>Day</TableColumn>
                    <TableColumn>Time</TableColumn>
                    <TableColumn>Privacy</TableColumn>
                    <TableColumn>Actions</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{getDayName(item.day)}</TableCell>
                        <TableCell>{formatTime(item.start_time)} - {formatTime(item.end_time)}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              item.privacy_level === 'precise' ? 'success' :
                              item.privacy_level === 'approximate' ? 'warning' : 'default'
                            }
                          >
                            {item.privacy_level}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            isIconOnly
                            variant="light"
                            onPress={() => {
                              const newSchedule = schedule.filter((_, i) => i !== index);
                              updateSchedule(newSchedule);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </AccordionItem>

        {/* Trusted Contacts */}
        <AccordionItem
          key="contacts"
          aria-label="Trusted Contacts"
          startContent={<Users className="w-5 h-5" />}
          title="Trusted Contacts"
        >
          <div className="space-y-4 p-4">
            <Button
              size="sm"
              startContent={<Plus className="w-4 h-4" />}
              onPress={onOpen}
            >
              Add Trusted Contact
            </Button>

            <Table>
              <TableHeader>
                <TableColumn>Contact</TableColumn>
                <TableColumn>Trust Level</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {trustedContacts.map(contact => (
                  <TableRow key={contact.id}>
                    <TableCell>{contact.user.full_name}</TableCell>
                    <TableCell>
                      <Select
                        size="sm"
                        value={contact.trust_level}
                        onChange={e => addTrustedContact(contact.contact_id, e.target.value as PrivacyLevel)}
                      >
                        <SelectItem key="precise" value="precise">Precise Location</SelectItem>
                        <SelectItem key="approximate" value="approximate">Approximate Location</SelectItem>
                        <SelectItem key="area" value="area">General Area</SelectItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        isIconOnly
                        variant="light"
                        color="danger"
                        onPress={() => removeTrustedContact(contact.contact_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
