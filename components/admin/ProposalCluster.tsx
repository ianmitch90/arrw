import { PlaceProposal } from '@/types/core';
import { Button, Card, Chip, ScrollShadow } from '@nextui-org/react';
import { Check, X, MapPin, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProposalClusterProps {
  proposals: PlaceProposal[];
  onApprove: (proposalId: string, mergedProposals?: string[]) => void;
  onReject: (proposalId: string, reason: string) => void;
}

export function ProposalCluster({ proposals, onApprove, onReject }: ProposalClusterProps) {
  if (!proposals.length) return null;

  // Sort proposals by creation date
  const sortedProposals = [...proposals].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const renderPlaceTypeIcon = (type: PlaceProposal['place_type']) => {
    switch (type) {
      case 'poi':
        return <MapPin className="w-4 h-4" />;
      case 'event_venue':
        return <Calendar className="w-4 h-4" />;
      case 'user_created':
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Cluster Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {proposals.length} Proposal{proposals.length > 1 ? 's' : ''} for Area
          </h3>
          <p className="text-sm text-default-500">
            First submitted {formatDistanceToNow(new Date(sortedProposals[0].created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="danger"
            variant="flat"
            onPress={() => {
              const reason = prompt('Enter rejection reason:');
              if (reason) {
                proposals.forEach(p => onReject(p.id, reason));
              }
            }}
          >
            Reject All
          </Button>
          <Button
            color="primary"
            onPress={() => {
              const mainProposal = sortedProposals[0];
              const mergedIds = sortedProposals.slice(1).map(p => p.id);
              onApprove(mainProposal.id, mergedIds);
            }}
          >
            Approve & Merge
          </Button>
        </div>
      </div>

      {/* Proposals List */}
      <ScrollShadow className="max-h-[400px]">
        <div className="space-y-3">
          {sortedProposals.map((proposal) => (
            <Card key={proposal.id} className="p-3">
              <div className="flex gap-4">
                {/* Photo */}
                {proposal.photo_url && (
                  <img
                    src={proposal.photo_url}
                    alt={proposal.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{proposal.name}</h4>
                        <Chip
                          size="sm"
                          startContent={renderPlaceTypeIcon(proposal.place_type)}
                        >
                          {proposal.place_type}
                        </Chip>
                      </div>
                      <p className="text-sm text-default-500">
                        Submitted {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) {
                            onReject(proposal.id, reason);
                          }
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        color="primary"
                        onPress={() => onApprove(proposal.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {proposal.description && (
                    <p className="text-sm mt-1">{proposal.description}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollShadow>
    </Card>
  );
}
