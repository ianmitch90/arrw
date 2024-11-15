import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { PlaceProposal } from '@/types/core';
import { ProposalMap } from '@/components/admin/ProposalMap';
import { Card, Tab, Tabs } from '@nextui-org/react';
import { ProposalCluster } from '@/components/admin/ProposalCluster';

export default function ProposalsPage() {
  const supabase = useSupabaseClient<Database>();
  const [proposals, setProposals] = useState<PlaceProposal[]>([]);
  const [selectedTab, setSelectedTab] = useState('map');

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from('place_proposals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching proposals:', error);
    } else {
      setProposals(data || []);
    }
  };

  const handleApproveProposal = async (proposalId: string, mergedProposals?: string[]) => {
    const { error } = await supabase.rpc('approve_place_proposal', {
      proposal_id: proposalId,
      merged_proposal_ids: mergedProposals
    });

    if (error) {
      console.error('Error approving proposal:', error);
    } else {
      fetchProposals();
    }
  };

  const handleRejectProposal = async (proposalId: string, reason: string) => {
    const { error } = await supabase.rpc('reject_place_proposal', {
      proposal_id: proposalId,
      rejection_reason: reason
    });

    if (error) {
      console.error('Error rejecting proposal:', error);
    } else {
      fetchProposals();
    }
  };

  // Group proposals by cluster
  const clusters = proposals.reduce((acc, proposal) => {
    if (!proposal.cluster_id) {
      // Single proposal cluster
      acc.push([proposal]);
    } else {
      // Find existing cluster or create new one
      const cluster = acc.find(c => c[0].cluster_id === proposal.cluster_id);
      if (cluster) {
        cluster.push(proposal);
      } else {
        acc.push([proposal]);
      }
    }
    return acc;
  }, [] as PlaceProposal[][]);

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-7xl mx-auto">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Place Proposals</h1>
          
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key.toString())}
          >
            <Tab key="map" title="Map View">
              <div className="h-[calc(100vh-200px)]">
                <ProposalMap />
              </div>
            </Tab>
            <Tab key="list" title="List View">
              <div className="space-y-4">
                {clusters.map((cluster, i) => (
                  <ProposalCluster
                    key={i}
                    proposals={cluster}
                    onApprove={handleApproveProposal}
                    onReject={handleRejectProposal}
                  />
                ))}
              </div>
            </Tab>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
