import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    const issues: string[] = [];
    const recommendations: string[] = [];
    let statusCode = 0;
    let responseTime = 0;
    let htmlContent = '';
    let headers: any = {};

    // Fetch website
    const startTime = Date.now();
    try {
      const response = await axios.get(normalizedUrl, {
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: () => true,
      });
      responseTime = Date.now() - startTime;
      statusCode = response.status;
      htmlContent = response.data;
      headers = response.headers;
    } catch (err: any) {
      return NextResponse.json({
        url: normalizedUrl,
        status: 'error',
        issues: [`Failed to fetch website: ${err.message}`],
        recommendations: ['Ensure the website is accessible and not blocking requests'],
        timestamp: new Date().toISOString(),
      } as CheckResult);
    }

    // Check status code
    if (statusCode >= 500) {
      issues.push(`Server error (${statusCode})`);
    } else if (statusCode >= 400) {
      issues.push(`Client error (${statusCode})`);
    } else if (statusCode >= 300) {
      issues.push(`Redirect detected (${statusCode})`);
    }

    // Check response time
    if (responseTime > 3000) {
      issues.push('Slow response time (>3 seconds)');
      recommendations.push('Consider optimizing server performance or using a CDN');
    } else if (responseTime > 1000) {
      recommendations.push('Response time could be improved (currently >1 second)');
    }

    // Parse HTML
    const $ = cheerio.load(htmlContent);

    // SEO Analysis
    let seoScore = 100;

    // Check title
    const title = $('title').text();
    if (!title || title.length === 0) {
      issues.push('Missing page title');
      seoScore -= 15;
    } else if (title.length > 60) {
      recommendations.push('Page title is too long (should be under 60 characters)');
      seoScore -= 5;
    }

    // Check meta description
    const metaDescription = $('meta[name="description"]').attr('content');
    if (!metaDescription) {
      issues.push('Missing meta description');
      seoScore -= 15;
    } else if (metaDescription.length > 160) {
      recommendations.push('Meta description is too long (should be under 160 characters)');
      seoScore -= 5;
    }

    // Check headings
    const h1Count = $('h1').length;
    if (h1Count === 0) {
      issues.push('No H1 heading found');
      seoScore -= 10;
    } else if (h1Count > 1) {
      recommendations.push('Multiple H1 headings detected (should have only one)');
      seoScore -= 5;
    }

    // Check images
    const imagesWithoutAlt = $('img:not([alt])').length;
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} images missing alt text`);
      seoScore -= Math.min(10, imagesWithoutAlt * 2);
    }

    // Check viewport meta tag
    const viewport = $('meta[name="viewport"]').attr('content');
    if (!viewport) {
      issues.push('Missing viewport meta tag for mobile responsiveness');
      seoScore -= 10;
    }

    // Security Analysis
    let securityScore = 100;

    // Check HTTPS
    if (!normalizedUrl.startsWith('https://')) {
      issues.push('Website is not using HTTPS');
      securityScore -= 30;
      recommendations.push('Enable HTTPS to secure data transmission');
    }

    // Check security headers
    const securityHeaders = {
      'strict-transport-security': 'Strict-Transport-Security',
      'x-frame-options': 'X-Frame-Options',
      'x-content-type-options': 'X-Content-Type-Options',
      'content-security-policy': 'Content-Security-Policy',
    };

    for (const [headerKey, headerName] of Object.entries(securityHeaders)) {
      if (!headers[headerKey] && !headers[headerKey.toLowerCase()]) {
        recommendations.push(`Consider adding ${headerName} header`);
        securityScore -= 10;
      }
    }

    // Performance Analysis
    let performanceScore = 100;

    // Check for common performance issues
    const inlineScripts = $('script:not([src])').length;
    if (inlineScripts > 5) {
      recommendations.push('Consider reducing inline scripts and using external files');
      performanceScore -= 10;
    }

    const externalScripts = $('script[src]').length;
    if (externalScripts > 15) {
      recommendations.push('Consider reducing number of external scripts');
      performanceScore -= 10;
    }

    const externalStylesheets = $('link[rel="stylesheet"]').length;
    if (externalStylesheets > 10) {
      recommendations.push('Consider combining CSS files to reduce HTTP requests');
      performanceScore -= 10;
    }

    // Check for minification
    if (htmlContent.includes('    ') || htmlContent.includes('\n\n\n')) {
      recommendations.push('Consider minifying HTML for better performance');
      performanceScore -= 5;
    }

    // Determine overall status
    let status: 'success' | 'error' | 'warning' = 'success';
    if (issues.length > 5 || statusCode >= 500) {
      status = 'error';
    } else if (issues.length > 0 || recommendations.length > 3) {
      status = 'warning';
    }

    // Add positive feedback
    if (issues.length === 0) {
      recommendations.push('Great job! No critical issues detected');
    }

    const result: CheckResult = {
      url: normalizedUrl,
      status,
      statusCode,
      responseTime,
      issues,
      recommendations,
      seoScore: Math.max(0, seoScore),
      performanceScore: Math.max(0, performanceScore),
      securityScore: Math.max(0, securityScore),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
