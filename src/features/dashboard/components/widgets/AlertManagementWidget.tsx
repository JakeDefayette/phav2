/**
 * Alert Management Widget
 *
 * Configuration and management interface for alert rules and notification settings
 * Allows users to create, edit, and test alert rules
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  TestTube,
  Bell,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  X,
  Play,
  Pause,
  Clock,
  Mail,
  Webhook,
  Slack,
  Users,
} from 'lucide-react';
import {
  alertingService,
  type AlertRule,
  type AlertCondition,
  type AlertAction,
  type ErrorLevel,
} from '@/shared/services/logging';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';
import { Input } from '@/shared/components/atoms/Input';
import { Label } from '@/shared/components/atoms/Label';
import { Loading } from '@/shared/components/atoms/Loading';

// Widget-specific types
interface AlertRuleFormData {
  name: string;
  description: string;
  enabled: boolean;
  severity: ErrorLevel;
  throttleMinutes: number;
  conditions: AlertCondition[];
  actions: AlertAction[];
}

interface WidgetProps {
  className?: string;
  compactMode?: boolean;
}

const AlertManagementWidget: React.FC<WidgetProps> = ({
  className = '',
  compactMode = false,
}) => {
  // State management
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState<AlertRuleFormData>({
    name: '',
    description: '',
    enabled: true,
    severity: 'warning',
    throttleMinutes: 15,
    conditions: [],
    actions: [],
  });
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);

  // Load alert rules
  const loadAlertRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const rules = alertingService?.getAllAlertRules() || [];
      setAlertRules(rules);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load alert rules'
      );
      console.error('[AlertManagementWidget] Failed to load rules:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlertRules();
  }, [loadAlertRules]);

  // Form handling
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      enabled: true,
      severity: 'warning',
      throttleMinutes: 15,
      conditions: [],
      actions: [],
    });
    setEditingRule(null);
  };

  const handleCreateRule = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const handleEditRule = (rule: AlertRule) => {
    setFormData({
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      severity: rule.severity,
      throttleMinutes: rule.throttleMinutes,
      conditions: [...rule.conditions],
      actions: [...rule.actions],
    });
    setEditingRule(rule);
    setShowCreateForm(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) {
      return;
    }

    try {
      await alertingService?.deleteAlertRule(ruleId);
      await loadAlertRules();
    } catch (err) {
      console.error('Failed to delete alert rule:', err);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await alertingService?.updateAlertRule(ruleId, { enabled });
      await loadAlertRules();
    } catch (err) {
      console.error('Failed to toggle alert rule:', err);
    }
  };

  const handleTestRule = async (ruleId: string) => {
    try {
      setTestingRuleId(ruleId);
      const result = await alertingService?.testAlertRule(ruleId);

      if (result?.success) {
        alert(`Test successful: ${result.message}`);
      } else {
        alert(`Test failed: ${result?.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert(
        `Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setTestingRuleId(null);
    }
  };

  const handleSubmitForm = async () => {
    try {
      if (editingRule) {
        // Update existing rule
        await alertingService?.updateAlertRule(editingRule.id, formData);
      } else {
        // Create new rule
        await alertingService?.createAlertRule(formData);
      }

      setShowCreateForm(false);
      resetForm();
      await loadAlertRules();
    } catch (err) {
      console.error('Failed to save alert rule:', err);
      alert(
        `Failed to save alert rule: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const addCondition = () => {
    const newCondition: AlertCondition = {
      type: 'threshold',
      operator: 'greater_than',
      value: 5,
      timeWindow: 5,
      field: 'error_rate',
    };
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, updates: Partial<AlertCondition>) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) =>
        i === index ? { ...cond, ...updates } : cond
      ),
    }));
  };

  const addAction = () => {
    const newAction: AlertAction = {
      type: 'email',
      enabled: true,
      config: {
        email: {
          recipients: [],
          subject: 'Alert Notification',
        },
      },
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction],
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateAction = (index: number, updates: Partial<AlertAction>) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, ...updates } : action
      ),
    }));
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail size={16} className='text-blue-500' />;
      case 'webhook':
        return <Webhook size={16} className='text-green-500' />;
      case 'slack':
        return <Slack size={16} className='text-purple-500' />;
      case 'escalate':
        return <Users size={16} className='text-orange-500' />;
      default:
        return <Bell size={16} className='text-gray-500' />;
    }
  };

  const getSeverityColor = (severity: ErrorLevel) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'debug':
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className='flex items-center justify-center h-64'>
          <Loading size='lg' />
        </div>
      </Card>
    );
  }

  // Compact mode rendering
  if (compactMode) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <Settings className='w-5 h-5 text-gray-600' />
            <div>
              <h3 className='text-sm font-semibold text-gray-900'>
                Alert Rules
              </h3>
              <p className='text-xs text-gray-600'>
                {alertRules.filter(r => r.enabled).length} of{' '}
                {alertRules.length} active
              </p>
            </div>
          </div>
          <Button onClick={handleCreateRule} size='sm' variant='outline'>
            <Plus className='w-4 h-4' />
          </Button>
        </div>
      </Card>
    );
  }

  // Full widget rendering
  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-3'>
          <Settings className='w-6 h-6 text-blue-600' />
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Alert Management
            </h2>
            <p className='text-sm text-gray-600'>
              Configure and manage alert rules and notifications
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateRule}
          className='flex items-center space-x-2'
        >
          <Plus className='w-4 h-4' />
          <span>Create Rule</span>
        </Button>
      </div>

      {/* Alert Rules List */}
      {error ? (
        <div className='text-center py-8'>
          <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <p className='text-red-600'>{error}</p>
        </div>
      ) : alertRules.length === 0 ? (
        <div className='text-center py-8'>
          <Bell className='w-12 h-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No Alert Rules
          </h3>
          <p className='text-gray-600 mb-4'>
            Create your first alert rule to start monitoring errors
          </p>
          <Button onClick={handleCreateRule}>
            <Plus className='w-4 h-4 mr-2' />
            Create Alert Rule
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {alertRules.map(rule => (
            <div
              key={rule.id}
              className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors'
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-3 mb-2'>
                    <h3 className='text-sm font-semibold text-gray-900'>
                      {rule.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded border ${getSeverityColor(rule.severity)}`}
                    >
                      {rule.severity}
                    </span>
                    <div className='flex items-center space-x-1 text-xs text-gray-500'>
                      {rule.enabled ? (
                        <CheckCircle size={14} className='text-green-500' />
                      ) : (
                        <XCircle size={14} className='text-red-500' />
                      )}
                      <span>{rule.enabled ? 'Active' : 'Disabled'}</span>
                    </div>
                  </div>
                  <p className='text-sm text-gray-600 mb-2'>
                    {rule.description}
                  </p>
                  <div className='flex items-center space-x-4 text-xs text-gray-500'>
                    <span>
                      <Clock size={12} className='inline mr-1' />
                      {rule.throttleMinutes}m throttle
                    </span>
                    <span>
                      {rule.conditions.length} condition
                      {rule.conditions.length !== 1 ? 's' : ''}
                    </span>
                    <span>
                      {rule.actions.length} action
                      {rule.actions.length !== 1 ? 's' : ''}
                    </span>
                    <span>Triggered {rule.triggerCount} times</span>
                  </div>

                  {/* Actions Preview */}
                  <div className='flex items-center space-x-2 mt-2'>
                    {rule.actions.map((action, index) => (
                      <div key={index} className='flex items-center space-x-1'>
                        {getActionIcon(action.type)}
                        <span className='text-xs text-gray-600 capitalize'>
                          {action.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Button
                    onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                    size='sm'
                    variant='outline'
                    className='p-2'
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.enabled ? <Pause size={14} /> : <Play size={14} />}
                  </Button>

                  <Button
                    onClick={() => handleTestRule(rule.id)}
                    size='sm'
                    variant='outline'
                    className='p-2'
                    disabled={testingRuleId === rule.id}
                    title='Test rule'
                  >
                    {testingRuleId === rule.id ? (
                      <Loading size='sm' />
                    ) : (
                      <TestTube size={14} />
                    )}
                  </Button>

                  <Button
                    onClick={() => handleEditRule(rule)}
                    size='sm'
                    variant='outline'
                    className='p-2'
                    title='Edit rule'
                  >
                    <Edit size={14} />
                  </Button>

                  <Button
                    onClick={() => handleDeleteRule(rule.id)}
                    size='sm'
                    variant='outline'
                    className='p-2 text-red-600 hover:bg-red-50'
                    title='Delete rule'
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-gray-900'>
                {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
              </h3>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant='outline'
                size='sm'
                className='p-2'
              >
                <X size={16} />
              </Button>
            </div>

            <div className='space-y-6'>
              {/* Basic Information */}
              <div>
                <Label htmlFor='rule-name'>Rule Name</Label>
                <Input
                  id='rule-name'
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder='High Error Rate Alert'
                  className='mt-1'
                />
              </div>

              <div>
                <Label htmlFor='rule-description'>Description</Label>
                <textarea
                  id='rule-description'
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder='Triggers when error rate exceeds threshold'
                  className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md resize-none h-20'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='rule-severity'>Severity</Label>
                  <select
                    id='rule-severity'
                    value={formData.severity}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        severity: e.target.value as ErrorLevel,
                      }))
                    }
                    className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md'
                  >
                    <option value='debug'>Debug</option>
                    <option value='info'>Info</option>
                    <option value='warning'>Warning</option>
                    <option value='critical'>Critical</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor='rule-throttle'>Throttle (minutes)</Label>
                  <Input
                    id='rule-throttle'
                    type='number'
                    value={formData.throttleMinutes}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        throttleMinutes: parseInt(e.target.value) || 15,
                      }))
                    }
                    min='1'
                    className='mt-1'
                  />
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  id='rule-enabled'
                  type='checkbox'
                  checked={formData.enabled}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      enabled: e.target.checked,
                    }))
                  }
                  className='rounded'
                />
                <Label htmlFor='rule-enabled'>Enable this rule</Label>
              </div>

              {/* Conditions */}
              <div>
                <div className='flex items-center justify-between mb-3'>
                  <Label>Conditions</Label>
                  <Button onClick={addCondition} size='sm' variant='outline'>
                    <Plus size={14} className='mr-1' />
                    Add Condition
                  </Button>
                </div>
                {formData.conditions.map((condition, index) => (
                  <div
                    key={index}
                    className='border border-gray-200 rounded p-3 mb-2'
                  >
                    <div className='grid grid-cols-4 gap-2 mb-2'>
                      <select
                        value={condition.type}
                        onChange={e =>
                          updateCondition(index, {
                            type: e.target.value as any,
                          })
                        }
                        className='px-2 py-1 border border-gray-300 rounded text-sm'
                      >
                        <option value='threshold'>Threshold</option>
                        <option value='pattern'>Pattern</option>
                        <option value='anomaly'>Anomaly</option>
                      </select>

                      <input
                        value={condition.field}
                        onChange={e =>
                          updateCondition(index, { field: e.target.value })
                        }
                        placeholder='error_rate'
                        className='px-2 py-1 border border-gray-300 rounded text-sm'
                      />

                      <select
                        value={condition.operator}
                        onChange={e =>
                          updateCondition(index, {
                            operator: e.target.value as any,
                          })
                        }
                        className='px-2 py-1 border border-gray-300 rounded text-sm'
                      >
                        <option value='greater_than'>Greater than</option>
                        <option value='less_than'>Less than</option>
                        <option value='equals'>Equals</option>
                        <option value='contains'>Contains</option>
                      </select>

                      <input
                        value={condition.value}
                        onChange={e =>
                          updateCondition(index, { value: e.target.value })
                        }
                        placeholder='5'
                        className='px-2 py-1 border border-gray-300 rounded text-sm'
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <input
                        type='number'
                        value={condition.timeWindow}
                        onChange={e =>
                          updateCondition(index, {
                            timeWindow: parseInt(e.target.value) || 5,
                          })
                        }
                        placeholder='Time window (minutes)'
                        className='px-2 py-1 border border-gray-300 rounded text-sm w-32'
                        min='1'
                      />
                      <Button
                        onClick={() => removeCondition(index)}
                        size='sm'
                        variant='outline'
                        className='text-red-600'
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div>
                <div className='flex items-center justify-between mb-3'>
                  <Label>Actions</Label>
                  <Button onClick={addAction} size='sm' variant='outline'>
                    <Plus size={14} className='mr-1' />
                    Add Action
                  </Button>
                </div>
                {formData.actions.map((action, index) => (
                  <div
                    key={index}
                    className='border border-gray-200 rounded p-3 mb-2'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center space-x-2'>
                        <select
                          value={action.type}
                          onChange={e =>
                            updateAction(index, { type: e.target.value as any })
                          }
                          className='px-2 py-1 border border-gray-300 rounded text-sm'
                        >
                          <option value='email'>Email</option>
                          <option value='webhook'>Webhook</option>
                          <option value='slack'>Slack</option>
                          <option value='escalate'>Escalate</option>
                        </select>
                        <input
                          type='checkbox'
                          checked={action.enabled}
                          onChange={e =>
                            updateAction(index, { enabled: e.target.checked })
                          }
                        />
                        <span className='text-sm text-gray-600'>Enabled</span>
                      </div>
                      <Button
                        onClick={() => removeAction(index)}
                        size='sm'
                        variant='outline'
                        className='text-red-600'
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    {action.type === 'email' && (
                      <div className='space-y-2'>
                        <input
                          value={action.config.email?.subject || ''}
                          onChange={e =>
                            updateAction(index, {
                              config: {
                                ...action.config,
                                email: {
                                  recipients:
                                    action.config.email?.recipients || [],
                                  ...action.config.email,
                                  subject: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder='Email subject'
                          className='w-full px-2 py-1 border border-gray-300 rounded text-sm'
                        />
                        <input
                          value={
                            action.config.email?.recipients?.join(', ') || ''
                          }
                          onChange={e =>
                            updateAction(index, {
                              config: {
                                ...action.config,
                                email: {
                                  recipients: e.target.value
                                    .split(',')
                                    .map(s => s.trim())
                                    .filter(Boolean),
                                  ...action.config.email,
                                },
                              },
                            })
                          }
                          placeholder='Recipients (comma-separated)'
                          className='w-full px-2 py-1 border border-gray-300 rounded text-sm'
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className='flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200'>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant='outline'
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitForm}>
                <Save className='w-4 h-4 mr-2' />
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AlertManagementWidget;
