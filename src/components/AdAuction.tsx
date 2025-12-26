/**
 * Ad Auction Component
 * Shows simulated RTB auction results - How companies bid to show you ads
 * TRANSPARENT: This is a simulation for educational purposes
 */

import { useState, useEffect, useCallback } from 'react';
import { runAdAuction, AD_PREFERENCE_PAGES, AD_COMPANIES, type AuctionResult, type AdBid } from '../utils/adAuction';
import type { VisitorInfo } from '../types';
import './AdAuction.css';

interface AdAuctionProps {
  visitor?: VisitorInfo | null;
}

export function AdAuction({ visitor }: AdAuctionProps) {
  const [auctionResult, setAuctionResult] = useState<AuctionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllBids, setShowAllBids] = useState(true);
  const [showValueBreakdown, setShowValueBreakdown] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const runAuction = useCallback(async () => {
    if (!visitor) return;

    setIsLoading(true);
    try {
      const result = await runAdAuction(visitor);
      setAuctionResult(result);
    } catch (error) {
      console.error('Auction error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [visitor]);

  // Run auction when visitor data arrives
  useEffect(() => {
    if (visitor?.client && !auctionResult && !isLoading) {
      runAuction();
    }
  }, [visitor, auctionResult, isLoading, runAuction]);

  const formatCPM = (cpm: number) => `$${cpm.toFixed(2)}`;

  // Separate bids by status
  const activeBids = auctionResult?.bids.filter(b => b.status === 'bid') || [];
  const noBids = auctionResult?.bids.filter(b => b.status === 'no-bid') || [];

  // Get country info
  const country = visitor?.server?.geo?.country || 'Unknown';
  const countryCode = visitor?.server?.geo?.countryCode || '';

  return (
    <div className={`ad-auction-panel ${mobileExpanded ? 'mobile-expanded' : ''}`}>
      {/* Mobile Collapsed Bar */}
      <button
        className="mobile-auction-bar"
        onClick={() => setMobileExpanded(!mobileExpanded)}
      >
        <span className="mobile-bar-left">
          <span className="live-dot"></span>
          <span className="mobile-bar-label">You're Worth:</span>
          {auctionResult?.winner && auctionResult.aiPowered ? (
            <>
              <span className="mobile-bar-value">${auctionResult.winner.cpm.toFixed(2)}</span>
              <span className="mobile-bar-company">for {auctionResult.winner.bidderName}</span>
            </>
          ) : auctionResult && !auctionResult.aiPowered ? (
            <span className="mobile-bar-loading">AI unavailable</span>
          ) : isLoading ? (
            <span className="mobile-bar-loading">Calculating...</span>
          ) : (
            <span className="mobile-bar-loading">Loading profile...</span>
          )}
        </span>
        <span className="mobile-bar-right">
          <span className={`mobile-bar-arrow ${mobileExpanded ? 'expanded' : ''}`}>▼</span>
        </span>
      </button>

      {/* Desktop Header */}
      <div className="auction-panel-header desktop-only">
        <div className="auction-panel-title">
          <span className="live-dot"></span>
          <h2>Ad Auction</h2>
        </div>
        <p className="auction-panel-subtitle">
          {auctionResult ? `${auctionResult.totalBidders} companies bidding for your attention` : 'Companies bidding for your attention'}
        </p>
      </div>

      {/* Main Content */}
      <div className="auction-panel-content">
        {/* Loading State */}
        {isLoading && (
          <div className="auction-loading-state">
            <div className="auction-loading-animation">
              <div className="bid-pulse"></div>
              <div className="bid-pulse delay-1"></div>
              <div className="bid-pulse delay-2"></div>
            </div>
            <span className="loading-text">Analyzing your profile...</span>
            <span className="loading-count">AI selecting relevant bidders for your location</span>
          </div>
        )}

        {/* Waiting for visitor data */}
        {!visitor?.client && !isLoading && (
          <div className="auction-loading-state">
            <div className="auction-loading-animation">
              <div className="bid-pulse"></div>
              <div className="bid-pulse delay-1"></div>
              <div className="bid-pulse delay-2"></div>
            </div>
            <span className="loading-text">Gathering your data...</span>
            <span className="loading-count">Fingerprinting in progress</span>
          </div>
        )}

        {/* Results - Only show if AI powered */}
        {auctionResult && !isLoading && auctionResult.aiPowered && (
          <>
            {/* Winner Card */}
            {auctionResult.winner && (
              <div className="winner-card">
                <div className="winner-card-badge"><span className="icon-trophy"></span> HIGHEST BIDDER</div>
                <div className="winner-card-content">
                  <div className="winner-card-name">{auctionResult.winner.bidderName}</div>
                  <div className="winner-card-bid">{formatCPM(auctionResult.winner.cpm)}</div>
                  <div className="winner-card-unit">per 1,000 impressions (CPM)</div>
                </div>
                <div className="winner-card-reason">
                  "{auctionResult.winner.reason}"
                </div>
              </div>
            )}

            {/* Value Breakdown - Why This Price */}
            {auctionResult.userValueBreakdown.length > 0 && (
              <div className="value-breakdown-container">
                <button
                  className="value-breakdown-header"
                  onClick={() => setShowValueBreakdown(!showValueBreakdown)}
                >
                  <span><span className="icon-chart"></span> Why This Price?</span>
                  <span className="expand-icon">{showValueBreakdown ? '−' : '+'}</span>
                </button>

                {showValueBreakdown && (
                  <div className="value-breakdown-list">
                    {auctionResult.userValueBreakdown.map((factor, index) => (
                      <div key={index} className={`value-factor ${factor.impactValue >= 1 ? 'positive' : 'negative'}`}>
                        <span className={`factor-icon ${factor.impactValue >= 1 ? 'up' : 'down'}`}></span>
                        <div className="factor-content">
                          <div className="factor-header">
                            <span className="factor-name">{factor.factor}</span>
                            <span className={`factor-impact ${factor.impactValue >= 1 ? 'positive' : 'negative'}`}>
                              {factor.impact}
                            </span>
                          </div>
                          <span className="factor-description">{factor.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats Row */}
            <div className="auction-stats-row">
              <div className="stat-box">
                <span className="stat-number">{activeBids.length}</span>
                <span className="stat-text">Bidders</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{noBids.length}</span>
                <span className="stat-text">No Bid</span>
              </div>
              <div className="stat-box country-stat">
                <span className="stat-number">{countryCode || '??'}</span>
                <span className="stat-text">{country}</span>
              </div>
            </div>

            {/* All Bids */}
            <div className="bids-container">
              <button
                className="bids-header-btn"
                onClick={() => setShowAllBids(!showAllBids)}
              >
                <span>All Bids ({activeBids.length})</span>
                <span className="expand-icon">{showAllBids ? '−' : '+'}</span>
              </button>

              {showAllBids && (
                <div className="bids-table">
                  {activeBids.map((bid, index) => (
                    <BidRow
                      key={`${bid.bidder}-${index}`}
                      bid={bid}
                      isWinner={auctionResult.winner?.bidder === bid.bidder}
                      rank={index + 1}
                    />
                  ))}

                  {/* No-bids */}
                  {noBids.length > 0 && (
                    <div className="failed-bids">
                      <div className="failed-bids-header">Didn't Bid:</div>
                      {noBids.slice(0, 5).map((bid, index) => (
                        <div key={`nobid-${index}`} className="failed-bid-row">
                          <span className="failed-name">{bid.bidderName}</span>
                          <span className="failed-reason">{bid.reason}</span>
                        </div>
                      ))}
                      {noBids.length > 5 && (
                        <div className="failed-bid-row more">
                          +{noBids.length - 5} more companies didn't bid
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="auction-info-box">
              <p>
                <strong><span className="icon-bolt"></span> This happens in &lt;100ms</strong> every time you visit a site with ads.
                Your data is sold to the highest bidder before the page even loads.
              </p>
              <p className="ai-note">
                <span className="icon-sparkle"></span> Simulated bids generated by AI based on your real profile data
                <span className="ai-note-explain">(Real RTB auctions require publisher licenses, SSP/DSP contracts, and IAB certification. This demo visualizes what happens behind closed doors using AI to generate realistic bids based on your actual fingerprint data.)</span>
              </p>
            </div>
          </>
        )}

        {/* Error State - AI not available */}
        {auctionResult && !isLoading && !auctionResult.aiPowered && (
          <div className="auction-error-state">
            <div className="error-icon">!</div>
            <p className="error-text">AI auction temporarily unavailable</p>
            <p className="error-subtext">Check out your real ad profiles below</p>
          </div>
        )}

        {/* Ad Preferences Section */}
        <div className="preferences-container">
          <button
            className="preferences-header-btn"
            onClick={() => setShowPreferences(!showPreferences)}
          >
            <span className="icon-search"></span>
            <span>See Your Real Ad Profiles</span>
            <span className="expand-icon">{showPreferences ? '−' : '+'}</span>
          </button>

          {showPreferences && (
            <div className="preferences-links-list">
              <p className="prefs-intro">
                These companies have profiles about you. See what they know:
              </p>
              {Object.values(AD_PREFERENCE_PAGES).map((page) => (
                <a
                  key={page.name}
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pref-link"
                >
                  <span className="pref-link-name">{page.name}</span>
                  <span className="pref-link-desc">{page.description}</span>
                  <span className="pref-link-arrow">→</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface BidRowProps {
  bid: AdBid;
  isWinner: boolean;
  rank: number;
}

function BidRow({ bid, isWinner, rank }: BidRowProps) {
  const [showReason, setShowReason] = useState(false);
  const company = AD_COMPANIES[bid.bidder];

  return (
    <div
      className={`bid-table-row ${isWinner ? 'winner' : ''} ${bid.category}`}
      onClick={() => setShowReason(!showReason)}
    >
      <span className="bid-rank">#{rank}</span>
      <div className="bid-info">
        <span className="bid-name">{bid.bidderName}</span>
        {company?.specialty && (
          <span className="bid-specialty">{company.specialty}</span>
        )}
        {showReason && (
          <span className="bid-reason">{bid.reason}</span>
        )}
      </div>
      <span className="bid-amount">{bid.cpm.toFixed(2)}</span>
      <span className={`bid-category-tag ${bid.category}`}>
        <span className={`icon-category icon-${bid.category}`}></span>
      </span>
      {isWinner && <span className="winner-tag">WON</span>}
    </div>
  );
}
