'use client';

import { useState } from 'react';
import axios from 'axios';

interface CheckResult {
  url: string;
  status: 'success' | 'error' | 'warning';
  statusCode?: number;
  responseTime?: number;
  issues: string[];
  recommendations: string[];
  seoScore?: number;
  performanceScore?: number;
  securityScore?: number;
  timestamp: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState('');

  const checkWebsite = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('/api/check', { url });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check website');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Website Maintenance Agent
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered monitoring and maintenance for your websites
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <div className="flex gap-4">
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && checkWebsite()}
              />
              <button
                onClick={checkWebsite}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Checking...' : 'Check Website'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                <span className={`text-sm font-semibold ${getStatusColor(result.status)}`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-500">{result.url}</p>
              <p className="text-xs text-gray-400">{new Date(result.timestamp).toLocaleString()}</p>
            </div>

            {result.statusCode && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Status Code</p>
                  <p className="text-2xl font-bold text-gray-900">{result.statusCode}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{result.responseTime}ms</p>
                </div>
                {result.seoScore !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">SEO Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(result.seoScore)}`}>
                      {result.seoScore}/100
                    </p>
                  </div>
                )}
                {result.performanceScore !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Performance</p>
                    <p className={`text-2xl font-bold ${getScoreColor(result.performanceScore)}`}>
                      {result.performanceScore}/100
                    </p>
                  </div>
                )}
              </div>
            )}

            {result.issues.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Issues Found</h3>
                <ul className="space-y-2">
                  {result.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">⚠</span>
                      <span className="text-gray-700">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">💡</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🔍 Website Analysis</h3>
              <p className="text-gray-600">Comprehensive analysis of website health, performance, and SEO</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">⚡ Performance Monitoring</h3>
              <p className="text-gray-600">Track response times and identify bottlenecks</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🔒 Security Checks</h3>
              <p className="text-gray-600">Verify HTTPS, security headers, and best practices</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">📊 SEO Analysis</h3>
              <p className="text-gray-600">Meta tags, headings, and search engine optimization</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 Issue Detection</h3>
              <p className="text-gray-600">Automatically identify common problems and errors</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">💡 Smart Recommendations</h3>
              <p className="text-gray-600">AI-powered suggestions for improvements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
