// frontend/src/app/rules/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Settings } from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  keywords: string[];
  response: string;
  enabled: boolean;
  priority: number;
}

export default function Rules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    keywords: '',
    response: '',
    enabled: true
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/rules', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      // Set default rules for demo
      setRules([
        {
          id: '1',
          name: 'Greeting',
          keywords: ['hello', 'hi', 'hey'],
          response: 'Hello! How can I help you today?',
          enabled: true,
          priority: 1
        },
        {
          id: '2',
          name: 'Help Request',
          keywords: ['help', 'support'],
          response: 'I\'m here to help! Please describe your issue.',
          enabled: true,
          priority: 2
        }
      ]);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.name || !newRule.keywords || !newRule.response) return;

    const rule: Rule = {
      id: `rule_${Date.now()}`,
      name: newRule.name,
      keywords: newRule.keywords.split(',').map(k => k.trim()),
      response: newRule.response,
      enabled: newRule.enabled,
      priority: rules.length + 1
    };

    try {
      const response = await fetch('http://localhost:4000/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(rule)
      });
      
      if (response.ok) {
        setRules([...rules, rule]);
      } else {
        // Add locally if API fails
        setRules([...rules, rule]);
      }
    } catch (error) {
      // Add locally if request fails
      setRules([...rules, rule]);
    }

    setNewRule({ name: '', keywords: '', response: '', enabled: true });
    setIsAddingRule(false);
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await fetch(`http://localhost:4000/api/rules/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
    
    setRules(rules.filter(rule => rule.id !== ruleId));
  };

  const handleToggleRule = async (ruleId: string) => {
    const updatedRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    setRules(updatedRules);

    try {
      const rule = updatedRules.find(r => r.id === ruleId);
      await fetch(`http://localhost:4000/api/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(rule)
      });
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auto-Reply Rules</h1>
          <p className="text-gray-600">Configure keyword-based automatic responses</p>
        </div>
        <button
          onClick={() => setIsAddingRule(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Add Rule Form */}
      {isAddingRule && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Pricing Inquiry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
              <input
                type="text"
                value={newRule.keywords}
                onChange={(e) => setNewRule({...newRule, keywords: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="price, cost, pricing"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Response Message</label>
            <textarea
              value={newRule.response}
              onChange={(e) => setNewRule({...newRule, response: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Thank you for your pricing inquiry! Our team will contact you with detailed pricing information."
            />
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setIsAddingRule(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </button>
            <button
              onClick={handleAddRule}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Rule
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Settings className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rules Configured</h3>
            <p className="text-gray-600 mb-4">Create your first auto-reply rule to get started</p>
            <button
              onClick={() => setIsAddingRule(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Your First Rule
            </button>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      rule.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Keywords: </span>
                    <span className="text-sm text-gray-700">
                      {rule.keywords.join(', ')}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <span className="text-sm font-medium text-gray-500">Response: </span>
                    <p className="text-sm text-gray-700 mt-1">{rule.response}</p>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      rule.enabled
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                  title='Delete Rule'
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
