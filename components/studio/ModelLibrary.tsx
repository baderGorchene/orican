'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { GarmentCategory, GarmentModel, ModelTier } from '@/lib/types';

interface ModelLibraryProps {
  filteredModels: GarmentModel[];
  selectedModel: GarmentModel;
  searchQuery: string;
  tierFilter: 'all' | ModelTier;
  categoryFilter: 'all' | GarmentCategory;
  onSearchChange: (q: string) => void;
  onTierChange: (tier: 'all' | ModelTier) => void;
  onCategoryChange: (cat: 'all' | GarmentCategory) => void;
  onModelSelect: (model: GarmentModel) => void;
}

const TIER_TABS = ['all', 'base', 'community', 'paid'] as const;
const CATEGORY_PILLS = ['all', 'tops', 'bottoms', 'outerwear'] as const;

const tierBadgeStyle = (tier: ModelTier) => ({
  background:
    tier === 'paid'
      ? 'rgba(221, 0, 114, 0.12)'
      : tier === 'community'
        ? 'rgba(101, 146, 197, 0.15)'
        : 'rgba(36, 44, 71, 0.08)',
  color:
    tier === 'paid' ? '#DD0072' : tier === 'community' ? '#6592C5' : '#242C47',
});

export const ModelLibrary: React.FC<ModelLibraryProps> = ({
  filteredModels,
  selectedModel,
  searchQuery,
  tierFilter,
  categoryFilter,
  onSearchChange,
  onTierChange,
  onCategoryChange,
  onModelSelect,
}) => {
  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1.5px solid rgba(101, 146, 197, 0.22)',
        background: 'rgba(240, 238, 230, 0.75)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
      }}
    >
      {/* Header + Filters */}
      <div
        style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(101, 146, 197, 0.18)',
          flexShrink: 0,
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <span
            style={{ fontSize: '11px', color: '#6592C5', fontWeight: 700, letterSpacing: '0.06em' }}
          >
            3D GARMENT LIBRARY
          </span>
          <span style={{ fontSize: '11px', color: '#55627F', fontWeight: 600 }}>
            {filteredModels.length} Models
          </span>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6592C5',
            }}
          />
          <input
            type="text"
            placeholder="Search models, cuts, fabric..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              border: '1.5px solid rgba(101, 146, 197, 0.3)',
              background: '#FFFFFF',
              color: '#242C47',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tier tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            background: 'rgba(101, 146, 197, 0.12)',
            padding: '3px',
            borderRadius: '8px',
            marginBottom: '10px',
          }}
        >
          {TIER_TABS.map((tier) => (
            <button
              key={tier}
              onClick={() => onTierChange(tier)}
              style={{
                padding: '6px 0',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'capitalize',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: tierFilter === tier ? '#FFFFFF' : 'transparent',
                color: tierFilter === tier ? '#242C47' : '#55627F',
                boxShadow:
                  tierFilter === tier ? '0 2px 6px rgba(36,44,71,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tier === 'all' ? 'All' : tier}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {CATEGORY_PILLS.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              style={{
                padding: '4px 10px',
                fontSize: '10.5px',
                fontWeight: 600,
                textTransform: 'capitalize',
                borderRadius: '999px',
                border: '1px solid',
                borderColor:
                  categoryFilter === cat ? '#6592C5' : 'rgba(101, 146, 197, 0.25)',
                background:
                  categoryFilter === cat ? 'rgba(101, 146, 197, 0.16)' : '#FFFFFF',
                color: categoryFilter === cat ? '#242C47' : '#55627F',
                cursor: 'pointer',
              }}
            >
              {cat === 'all' ? 'All Cuts' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable model card list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {filteredModels.map((model) => {
          const isSelected = selectedModel.id === model.id;
          const badge = tierBadgeStyle(model.tier);
          return (
            <div
              key={model.id}
              onClick={() => onModelSelect(model)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onModelSelect(model)}
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
                border: '1.5px solid',
                borderColor: isSelected ? '#6592C5' : 'rgba(101, 146, 197, 0.22)',
                boxShadow: isSelected
                  ? '0 10px 24px -8px rgba(101, 146, 197, 0.3)'
                  : '0 4px 12px rgba(36, 44, 71, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Top row: tier badge + price */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '9.5px',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    ...badge,
                  }}
                >
                  {model.badge || model.tier.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#242C47' }}>
                  ${model.blankPrice.toFixed(2)} blank
                </span>
              </div>

              <div
                style={{ fontWeight: 700, fontSize: '13.5px', color: '#242C47', marginBottom: '4px' }}
              >
                {model.name}
              </div>

              <div
                style={{
                  fontSize: '11.5px',
                  color: '#55627F',
                  lineHeight: 1.4,
                  marginBottom: '8px',
                }}
              >
                {model.description}
              </div>

              {/* Footer: GSM + print zone */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10.5px',
                  color: '#6592C5',
                  fontWeight: 600,
                }}
              >
                <span>{model.gsm ? `${model.gsm} GSM` : model.category}</span>
                <span>{model.printZone.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
