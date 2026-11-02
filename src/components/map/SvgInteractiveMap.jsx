import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { Plus, Minus, RotateCcw } from 'lucide-react';

export const SvgInteractiveMap = ({
  mapData,
  targetFeature,
  questionMode, // 'find-on-map' | 'name-the-place'
  feedback, // { ok, tappedId, tappedName } | null
  showSolution,
  onFeatureClick,
  disabled
}) => {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomBehaviorRef = useRef(null);

  const { kind, base, targets, width, height, pathGen } = mapData;

  // Initialize D3 Zoom and Pan behavior
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const zoom = d3Zoom()
      .scaleExtent([1, 14])
      .translateExtent([[-width * 0.5, -height * 0.5], [width * 1.5, height * 1.5]])
      .clickDistance(8)
      .on('zoom', (event) => {
        select(gRef.current).attr('transform', event.transform);
      });

    select(svgRef.current).call(zoom);
    zoomBehaviorRef.current = zoom;

    return () => {
      select(svgRef.current).on('.zoom', null);
    };
  }, [width, height]);

  // Zoom control handlers
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomBehaviorRef.current) {
      select(svgRef.current)
        .transition()
        .duration(250)
        .call(zoomBehaviorRef.current.scaleBy, 1.6);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomBehaviorRef.current) {
      select(svgRef.current)
        .transition()
        .duration(250)
        .call(zoomBehaviorRef.current.scaleBy, 1 / 1.6);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (svgRef.current && zoomBehaviorRef.current) {
      select(svgRef.current)
        .transition()
        .duration(350)
        .call(zoomBehaviorRef.current.transform, zoomIdentity);
    }
  }, []);

  // Auto-focus on target in "name-the-place" mode or when revealed
  const focusOnTarget = useCallback(() => {
    if (!targetFeature || !svgRef.current || !zoomBehaviorRef.current || !pathGen) return;

    try {
      const bounds = pathGen.bounds(targetFeature);
      const [[x0, y0], [x1, y1]] = bounds;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const size = Math.max(dx, dy);

      if (size < 90 && size > 0) {
        const scale = Math.min(8, Math.max(2, 200 / size));
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;

        select(svgRef.current)
          .transition()
          .duration(500)
          .call(
            zoomBehaviorRef.current.transform,
            zoomIdentity.translate(width / 2 - scale * cx, height / 2 - scale * cy).scale(scale)
          );
      } else {
        handleResetZoom();
      }
    } catch {
      handleResetZoom();
    }
  }, [targetFeature, pathGen, width, height, handleResetZoom]);

  // Focus when questionMode is "name-the-place" or when solution is revealed
  useEffect(() => {
    if (questionMode === 'name-the-place' && targetFeature) {
      focusOnTarget();
    } else if (showSolution && targetFeature) {
      focusOnTarget();
    } else {
      handleResetZoom();
    }
  }, [targetFeature, questionMode, showSolution, focusOnTarget, handleResetZoom]);

  // Target centroid for focal circles and labels
  const centroid = useMemo(() => {
    if (!targetFeature || !pathGen) return null;
    try {
      const c = pathGen.centroid(targetFeature);
      if (isNaN(c[0]) || isNaN(c[1])) return null;
      return c;
    } catch {
      return null;
    }
  }, [targetFeature, pathGen]);

  // Calculate fill colors dynamically matching SIBAQ Tracker design system
  const getFeatureFill = useCallback(
    (feature, layerType) => {
      const isTarget = targetFeature && feature.id === targetFeature.id;
      const isTapped = feedback && feature.id === feedback.tappedId;

      // Solution revealed or answered correctly
      if ((showSolution || (feedback && feedback.ok)) && isTarget) {
        return '#10b981'; // Green
      }

      // Wrong region clicked
      if (feedback && !feedback.ok && isTapped) {
        return '#ef4444'; // Red
      }

      // "Name the place" active highlighted target
      if (questionMode === 'name-the-place' && isTarget) {
        return '#d97706'; // Amber / brown
      }

      // Physical targets layer default
      if (layerType === 'phys') {
        return '#818cf8'; // Soft indigo for mountain ranges, plateaus, etc.
      }

      // Base background land
      return '#e2e8f0';
    },
    [targetFeature, feedback, showSolution, questionMode]
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px',
        maxHeight: '620px',
        background: '#c5e2f6', // Natural maritime sea blue
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1.5px solid var(--border)',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: questionMode === 'find-on-map' && !disabled ? 'crosshair' : 'grab',
          touchAction: 'none'
        }}
        role="img"
        aria-label="Interactive Geography Map"
      >
        <g ref={gRef}>
          {/* Base Country / State Polygons */}
          {base.map((feat) => {
            const d = pathGen(feat);
            if (!d) return null;
            return (
              <path
                key={feat.id}
                d={d}
                fill={getFeatureFill(feat, 'base')}
                stroke="#64748b"
                strokeWidth="0.75"
                vectorEffect="non-scaling-stroke"
                onClick={() => {
                  if (kind !== 'phys' && questionMode === 'find-on-map' && !disabled) {
                    onFeatureClick(feat);
                  }
                }}
                style={{
                  cursor:
                    kind !== 'phys' && questionMode === 'find-on-map' && !disabled
                      ? 'pointer'
                      : 'inherit',
                  transition: 'fill 0.2s ease'
                }}
              />
            );
          })}

          {/* Physical Target Overlays (Mountains, Oceans, Deserts, Plateaus, Grasslands) */}
          {kind === 'phys' &&
            targets.map((feat) => {
              const d = pathGen(feat);
              if (!d) return null;
              const isTarget = targetFeature && feat.id === targetFeature.id;
              return (
                <path
                  key={feat.id}
                  d={d}
                  fill={getFeatureFill(feat, 'phys')}
                  fillOpacity={questionMode === 'name-the-place' && isTarget ? 0.95 : 0.65}
                  stroke={questionMode === 'name-the-place' && isTarget ? '#92400e' : '#4338ca'}
                  strokeWidth={questionMode === 'name-the-place' && isTarget ? '1.5' : '1'}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="all"
                  onClick={() => {
                    if (questionMode === 'find-on-map' && !disabled) {
                      onFeatureClick(feat);
                    }
                  }}
                  style={{
                    cursor: questionMode === 'find-on-map' && !disabled ? 'pointer' : 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                />
              );
            })}

          {/* Focal Ring Around Target (in "Name the place" or upon solution reveal) */}
          {(questionMode === 'name-the-place' || showSolution || (feedback && feedback.ok)) &&
            centroid && (
              <>
                {/* Pulsing Outer Focal Ring */}
                <circle
                  cx={centroid[0]}
                  cy={centroid[1]}
                  r="14"
                  fill="none"
                  stroke={
                    showSolution || (feedback && feedback.ok)
                      ? '#10b981'
                      : feedback && !feedback.ok
                      ? '#ef4444'
                      : '#dc2626'
                  }
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Center Target Dot */}
                <circle
                  cx={centroid[0]}
                  cy={centroid[1]}
                  r="4"
                  fill={
                    showSolution || (feedback && feedback.ok)
                      ? '#10b981'
                      : feedback && !feedback.ok
                      ? '#ef4444'
                      : '#dc2626'
                  }
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}

          {/* Revealed Place Name Label (Shown only when revealed or solved) */}
          {(showSolution || (feedback && feedback.ok)) && centroid && targetFeature && (
            <text
              x={centroid[0]}
              y={centroid[1] - 18}
              textAnchor="middle"
              fontSize="14"
              fontWeight="800"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="4"
              paintOrder="stroke"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {targetFeature.properties.name}
            </text>
          )}
        </g>
      </svg>

      {/* Floating In-Map Zoom Controls */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          borderRadius: '8px',
          padding: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
          border: '1px solid var(--border)'
        }}
      >
        <button
          type="button"
          onClick={handleZoomIn}
          style={{
            width: '32px',
            height: '32px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1f2937',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
          title="Zoom in (+)"
        >
          <Plus size={18} />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          style={{
            width: '32px',
            height: '32px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1f2937',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
          title="Zoom out (−)"
        >
          <Minus size={18} />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          style={{
            width: '32px',
            height: '32px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1f2937',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
          title="Reset View"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
};

export default SvgInteractiveMap;
