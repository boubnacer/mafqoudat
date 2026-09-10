import React, { useMemo, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from '../../../utils/translations';
import { chartPalette, areaFill, compactNumber, niceMax, shortDay } from './chartTokens';
import useChartSize from './useChartSize';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';

/**
 * The panel's time chart, in two forms over one implementation.
 *
 * `variant="stack"` draws stacked columns - used where two series make a whole
 * (lost + found listings on a day). `variant="area"` draws one 2px line with a
 * 12% wash under it and a marker on the last point - used where a single number
 * moves over time (visitors, signups).
 *
 * There is never a second y axis. Two measures of different scale get two
 * charts; the alignment of two scales on one plot is arbitrary and invents a
 * relationship the data does not contain.
 *
 * In Arabic the x axis runs right to left, because that is the direction time
 * reads in. Everything is positioned from `xFor`, so that is one flag rather
 * than a mirrored copy of the component.
 */

const PAD_TOP = 12;
const PAD_BOTTOM = 22;
const PAD_X = 6;
const AXIS_WIDTH = 34;
const MAX_BAR = 22;
const BAR_RADIUS = 4;
const STACK_GAP = 2;

// A column with rounded top corners and a square foot on the baseline.
const topRoundedRect = (x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  if (height <= 0) return '';
  return [
    `M${x},${y + height}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height}`,
    'Z',
  ].join(' ');
};

const TrendChart = ({
  data = [],
  series = [],
  variant = 'stack',
  height = 210,
  emptyLabel,
}) => {
  const theme = useTheme();
  const { currentLanguage } = useTranslation();
  const palette = chartPalette(theme);
  const [hostRef, width] = useChartSize();
  const [hovered, setHovered] = useState(null);
  const isRtl = theme.direction === 'rtl';

  const plotWidth = Math.max(80, width - AXIS_WIDTH - PAD_X * 2);
  const plotHeight = Math.max(60, height - PAD_TOP - PAD_BOTTOM);
  const band = data.length ? plotWidth / data.length : plotWidth;

  const max = useMemo(() => {
    const totals = data.map((row) =>
      variant === 'stack'
        ? series.reduce((sum, entry) => sum + (row[entry.key] || 0), 0)
        : Math.max(...series.map((entry) => row[entry.key] || 0))
    );
    return niceMax(Math.max(1, ...totals));
  }, [data, series, variant]);

  // The axis column sits on the inline-start edge, so it swaps sides with the
  // document; the plot always fills whatever is left.
  const plotLeft = isRtl ? PAD_X : AXIS_WIDTH + PAD_X;
  const axisTextX = isRtl ? plotLeft + plotWidth + PAD_X + 4 : AXIS_WIDTH - 6;
  const axisAnchor = isRtl ? 'start' : 'end';

  const xFor = (index) =>
    isRtl
      ? plotLeft + plotWidth - (index + 0.5) * band
      : plotLeft + (index + 0.5) * band;
  const yFor = (value) => PAD_TOP + plotHeight - (value / max) * plotHeight;

  const ticks = [0, max / 2, max];

  const hoveredRow = hovered !== null ? data[hovered] : null;

  if (!data.length) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">{emptyLabel}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <ChartLegend series={series} />
      <Box ref={hostRef} sx={{ position: 'relative', width: '100%' }}>
        {hoveredRow ? (
          <ChartTooltip
            x={xFor(hovered)}
            containerWidth={width}
            title={shortDay(hoveredRow.date, currentLanguage)}
            rows={series.map((entry) => ({
              label: entry.label,
              color: entry.color,
              value: (hoveredRow[entry.key] || 0).toLocaleString(),
            }))}
          />
        ) : null}

        <svg
          width={width}
          height={height}
          role="img"
          style={{ display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Gridlines: solid hairlines, one step off the surface. */}
          {ticks.map((tick) => (
            <g key={`tick-${tick}`}>
              <line
                x1={plotLeft}
                x2={plotLeft + plotWidth}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke={palette.grid}
                strokeWidth="1"
              />
              <text
                x={axisTextX}
                y={yFor(tick) + 3.5}
                textAnchor={axisAnchor}
                fill={palette.axisText}
                fontSize="10"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {compactNumber(tick)}
              </text>
            </g>
          ))}

          {variant === 'stack'
            ? data.map((row, index) => {
                const barWidth = Math.min(MAX_BAR, Math.max(3, band * 0.62));
                const x = xFor(index) - barWidth / 2;
                let cursor = PAD_TOP + plotHeight;
                // Drawn bottom-up so the topmost non-zero segment is the one
                // that gets the rounded cap.
                const stacked = series
                  .map((entry) => ({ entry, value: row[entry.key] || 0 }))
                  .filter((item) => item.value > 0);
                return (
                  <g key={row.date}>
                    {stacked.map((item, position) => {
                      const rawHeight = (item.value / max) * plotHeight;
                      const isTop = position === stacked.length - 1;
                      // A 2px gap in the surface colour separates touching
                      // segments; never a stroke around the mark.
                      const segmentHeight = Math.max(
                        1.5,
                        rawHeight - (isTop ? 0 : STACK_GAP)
                      );
                      const y = cursor - rawHeight;
                      cursor -= rawHeight;
                      return (
                        <path
                          key={item.entry.key}
                          d={topRoundedRect(
                            x,
                            y,
                            barWidth,
                            segmentHeight,
                            isTop ? BAR_RADIUS : 0
                          )}
                          fill={item.entry.color}
                          opacity={hovered === null || hovered === index ? 1 : 0.42}
                        />
                      );
                    })}
                  </g>
                );
              })
            : series.map((entry) => {
                const points = data.map((row, index) => [xFor(index), yFor(row[entry.key] || 0)]);
                const line = points
                  .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`)
                  .join(' ');
                const baseline = PAD_TOP + plotHeight;
                const area = `${line} L${points[points.length - 1][0]},${baseline} L${points[0][0]},${baseline} Z`;
                const last = points[points.length - 1];
                return (
                  <g key={entry.key}>
                    <path d={area} fill={areaFill(entry.color)} />
                    <path
                      d={line}
                      fill="none"
                      stroke={entry.color}
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {/* End marker, with the 2px surface ring that keeps it
                        legible wherever it lands. */}
                    <circle
                      cx={last[0]}
                      cy={last[1]}
                      r="4.5"
                      fill={entry.color}
                      stroke={palette.surface}
                      strokeWidth="2"
                    />
                    {hovered !== null ? (
                      <circle
                        cx={xFor(hovered)}
                        cy={yFor(data[hovered][entry.key] || 0)}
                        r="4.5"
                        fill={entry.color}
                        stroke={palette.surface}
                        strokeWidth="2"
                      />
                    ) : null}
                  </g>
                );
              })}

          {/* Crosshair for the line form. */}
          {variant === 'area' && hovered !== null ? (
            <line
              x1={xFor(hovered)}
              x2={xFor(hovered)}
              y1={PAD_TOP}
              y2={PAD_TOP + plotHeight}
              stroke={palette.grid}
              strokeWidth="1"
            />
          ) : null}

          {/* Date labels: first, middle and last only. A tick per day is
              unreadable at 30 points and unnecessary - the tooltip carries
              the rest. */}
          {[0, Math.floor((data.length - 1) / 2), data.length - 1]
            .filter((index, position, all) => all.indexOf(index) === position)
            .map((index) => (
              <text
                key={`label-${index}`}
                x={xFor(index)}
                y={height - 6}
                textAnchor="middle"
                fill={palette.axisText}
                fontSize="10"
              >
                {shortDay(data[index].date, currentLanguage)}
              </text>
            ))}

          {/* Hit targets: one full-height band per point, wider than the mark
              so a column three pixels across is still hoverable. */}
          {data.map((row, index) => (
            <rect
              key={`hit-${row.date}`}
              x={xFor(index) - band / 2}
              y={PAD_TOP}
              width={band}
              height={plotHeight}
              fill="transparent"
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              tabIndex={-1}
            />
          ))}
        </svg>
      </Box>
    </Box>
  );
};

export default TrendChart;
