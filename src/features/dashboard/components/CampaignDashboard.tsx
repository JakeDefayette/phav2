'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';
import { Loading } from '@/shared/components/atoms/Loading';
import { Alert } from '@/shared/components/molecules/Alert';
import { ChartDisplay } from '@/features/reports/components/ChartDisplay';
import {
  CampaignManager,
  CampaignFilters,
  CampaignAnalytics,
} from '../services/campaignManager';
import {
  Plus,
  Send,
  Calendar,
  TrendingUp,
  Users,
  Mail,
  Eye,
  MousePointer,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  created_at: string;
  sent_at?: string;
  scheduled_at?: string;
  send_count?: number;
  recipient_count?: number;
  open_rate?: number;
  click_rate?: number;
}

interface CampaignDashboardProps {
  practiceId: string;
  campaignManager: CampaignManager;
}

export const CampaignDashboard: React.FC<CampaignDashboardProps> = ({
  practiceId,
  campaignManager,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, CampaignAnalytics>>(
    {}
  );
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Stats summary
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
  });

  useEffect(() => {
    loadCampaigns();
  }, [practiceId, filters]);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await campaignManager.getCampaigns(practiceId, filters, {
        page: 1,
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      setCampaigns(result.campaigns as Campaign[]);

      // Calculate stats
      const totalCampaigns = result.total;
      const activeCampaigns = result.campaigns.filter(
        c => c.status === 'scheduled' || c.status === 'sending'
      ).length;
      const totalSent = result.campaigns.reduce(
        (sum, c) => sum + (c.send_count || 0),
        0
      );
      const avgOpenRate =
        result.campaigns.length > 0
          ? result.campaigns.reduce((sum, c) => sum + (c.open_rate || 0), 0) /
            result.campaigns.length
          : 0;
      const avgClickRate =
        result.campaigns.length > 0
          ? result.campaigns.reduce((sum, c) => sum + (c.click_rate || 0), 0) /
            result.campaigns.length
          : 0;

      setStats({
        totalCampaigns,
        activeCampaigns,
        totalSent,
        avgOpenRate,
        avgClickRate,
      });

      // Load analytics for recent campaigns
      const recentCampaigns = result.campaigns.slice(0, 10);
      const analyticsPromises = recentCampaigns.map(async campaign => {
        try {
          const analytics = await campaignManager.getCampaignAnalytics(
            campaign.id
          );
          return { campaignId: campaign.id, analytics };
        } catch (error) {
          console.error(
            `Failed to load analytics for campaign ${campaign.id}:`,
            error
          );
          return null;
        }
      });

      const analyticsResults = await Promise.all(analyticsPromises);
      const analyticsMap: Record<string, CampaignAnalytics> = {};

      analyticsResults.forEach(result => {
        if (result) {
          analyticsMap[result.campaignId] = result.analytics;
        }
      });

      setAnalytics(analyticsMap);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const result = await campaignManager.sendCampaign(campaignId);
      if (result.success) {
        await loadCampaigns(); // Refresh the list
      } else {
        setError(`Failed to send campaign: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to send campaign:', error);
      setError('Failed to send campaign. Please try again.');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceChartData = () => {
    const campaignNames = campaigns
      .slice(0, 10)
      .map(c => c.name.substring(0, 15) + '...');
    const openRates = campaigns.slice(0, 10).map(c => c.open_rate || 0);
    const clickRates = campaigns.slice(0, 10).map(c => c.click_rate || 0);

    return {
      labels: campaignNames,
      datasets: [
        {
          label: 'Open Rate (%)',
          data: openRates,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
        {
          label: 'Click Rate (%)',
          data: clickRates,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
      ],
    };
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <Loading size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Email Campaigns</h1>
          <p className='text-gray-600'>
            Manage and monitor your email campaigns
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = '/dashboard/campaigns/new')}
          className='flex items-center gap-2'
        >
          <Plus size={16} />
          New Campaign
        </Button>
      </div>

      {error && (
        <Alert variant='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
        <Card className='p-4'>
          <div className='flex items-center'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Mail size={20} className='text-blue-600' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>
                Total Campaigns
              </p>
              <p className='text-lg font-semibold text-gray-900'>
                {stats.totalCampaigns}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center'>
            <div className='p-2 bg-yellow-100 rounded-lg'>
              <Send size={20} className='text-yellow-600' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Active</p>
              <p className='text-lg font-semibold text-gray-900'>
                {stats.activeCampaigns}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <Users size={20} className='text-green-600' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Total Sent</p>
              <p className='text-lg font-semibold text-gray-900'>
                {stats.totalSent.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center'>
            <div className='p-2 bg-purple-100 rounded-lg'>
              <Eye size={20} className='text-purple-600' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Avg Open Rate</p>
              <p className='text-lg font-semibold text-gray-900'>
                {stats.avgOpenRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center'>
            <div className='p-2 bg-orange-100 rounded-lg'>
              <MousePointer size={20} className='text-orange-600' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>
                Avg Click Rate
              </p>
              <p className='text-lg font-semibold text-gray-900'>
                {stats.avgClickRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Chart */}
      {campaigns.length > 0 && (
        <Card className='p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Campaign Performance
          </h3>
          <div className='h-64'>
            <ChartDisplay
              type='bar'
              data={getPerformanceChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: function (value) {
                        return value + '%';
                      },
                    },
                  },
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className='p-4'>
        <div className='flex flex-wrap gap-4'>
          <select
            value={filters.status || ''}
            onChange={e =>
              setFilters({
                ...filters,
                status: (e.target.value as any) || undefined,
              })
            }
            className='border border-gray-300 rounded-md px-3 py-2'
          >
            <option value=''>All Statuses</option>
            <option value='draft'>Draft</option>
            <option value='scheduled'>Scheduled</option>
            <option value='sending'>Sending</option>
            <option value='sent'>Sent</option>
            <option value='cancelled'>Cancelled</option>
          </select>

          <select
            value={filters.templateType || ''}
            onChange={e =>
              setFilters({
                ...filters,
                templateType: e.target.value || undefined,
              })
            }
            className='border border-gray-300 rounded-md px-3 py-2'
          >
            <option value=''>All Types</option>
            <option value='newsletter'>Newsletter</option>
            <option value='promotional'>Promotional</option>
            <option value='welcome'>Welcome</option>
            <option value='follow_up'>Follow Up</option>
          </select>

          <Button
            variant='outline'
            onClick={() => setFilters({})}
            className='ml-auto'
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Campaigns List */}
      <Card className='overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Recent Campaigns
          </h3>
        </div>

        {campaigns.length === 0 ? (
          <div className='p-8 text-center'>
            <Mail size={48} className='mx-auto text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No campaigns yet
            </h3>
            <p className='text-gray-600 mb-4'>
              Create your first email campaign to get started
            </p>
            <Button
              onClick={() =>
                (window.location.href = '/dashboard/campaigns/new')
              }
            >
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Campaign
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Recipients
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Open Rate
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Click Rate
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {campaigns.map(campaign => (
                  <tr key={campaign.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {campaign.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {campaign.subject}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      {campaign.recipient_count || 0}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      {campaign.open_rate
                        ? `${campaign.open_rate.toFixed(1)}%`
                        : '-'}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      {campaign.click_rate
                        ? `${campaign.click_rate.toFixed(1)}%`
                        : '-'}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {campaign.status === 'sent'
                        ? formatDate(campaign.sent_at)
                        : campaign.status === 'scheduled'
                          ? formatDate(campaign.scheduled_at)
                          : formatDate(campaign.created_at)}
                    </td>
                    <td className='px-6 py-4 text-right text-sm font-medium space-x-2'>
                      {campaign.status === 'draft' && (
                        <>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              (window.location.href = `/dashboard/campaigns/${campaign.id}/edit`)
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size='sm'
                            onClick={() => handleSendCampaign(campaign.id)}
                          >
                            Send
                          </Button>
                        </>
                      )}
                      {campaign.status === 'scheduled' && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            (window.location.href = `/dashboard/campaigns/${campaign.id}/edit`)
                          }
                        >
                          Edit Schedule
                        </Button>
                      )}
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() =>
                          (window.location.href = `/dashboard/campaigns/${campaign.id}/analytics`)
                        }
                      >
                        <TrendingUp size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CampaignDashboard;
