// import React, { useState } from 'react';
// import {
//     Paper,
//     Typography,
//     Grid,
//     Stack,
//     TextField,
//     MenuItem,
// } from '@mui/material';
// import { PieChartRounded } from '@mui/icons-material';
// import { PieChart, legendClasses } from '@mui/x-charts';

// import type { EnrichedHolding } from '../data/mockData';
// import { valueFormatter } from '../data/mockData';

// // Type for chart data points
// interface ChartData {
//     label: string;
//     value: number;
// }

// interface RiskChartProps {
//     holdings: EnrichedHolding[];
// }

// // Return top 4 + 'Others' if needed
// function getTop4Data(data: ChartData[]): ChartData[] {
//     const sorted = [...data].sort((a, b) => b.value - a.value);

//     if (sorted.length > 4) {
//         const top4 = sorted.slice(0, 4);
//         const others = sorted.slice(4);
//         const othersValue = others.reduce((sum, row) => sum + row.value, 0);
//         return [...top4, { label: 'Others', value: parseFloat(othersValue.toFixed(2)) }];
//     }

//     return sorted;
// }

// // --- Chart Config ---
// const pieChartSlotsProps = {
//     legend: {
//         direction: 'horizontal' as const,
//         position: {
//             vertical: 'bottom' as const,
//             horizontal: 'center' as const,
//         },
//         sx: {
//             gap: '14px',
//             [`.${legendClasses.mark}`]: {
//                 height: 14,
//                 width: 14,
//             },
//             '.MuiChartsLegend-series': {
//                 gap: '9px',
//             },
//         },
//     },
// };

// const pieChartSeriesProps = {
//     innerRadius: 50,
//     outerRadius: 120,
//     paddingAngle: 1,
//     cornerRadius: 3,
//     highlightScope: { fade: 'global' as const, highlight: 'item' as const },
//     faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
//     valueFormatter,
// };

// // --- Component ---
// const RiskChart: React.FC<RiskChartProps> = ({ holdings }) => {
//     // --- Sector Summary (Group by sector) ---
//     const sectorSummaryMap = holdings.reduce<Record<string, number>>((acc, hold) => {
//         const { sector, stockValue } = hold;
//         acc[sector] = (acc[sector] || 0) + stockValue;
//         return acc;
//     }, {});

//     const sectorSummaryResult: ChartData[] = getTop4Data(
//         Object.entries(sectorSummaryMap).map(([label, value]) => ({
//             label,
//             value: parseFloat(value.toFixed(2)),
//         }))
//     );

//     // --- Asset Summary (Each asset individually) ---
//     const assetSummaryResult: ChartData[] = getTop4Data(
//         holdings.map((row) => ({
//             label: row.asset,
//             value: parseFloat((row.currentPrice * row.quantity).toFixed(2)),
//         }))
//     );
//     const [exposure, setExposure] = useState<'sector' | 'asset'>('sector');

//     const chartData: ChartData[] = exposure === 'sector' ? sectorSummaryResult : assetSummaryResult;

//     return (
//         <Paper elevation={3} sx={{ padding: 2, width: '100%' }}>
//             <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
//                 <PieChartRounded color="primary" sx={{ fontSize: 40 }} />
//                 <Typography variant="h5" gutterBottom>
//                     Risk Exposure by {exposure === 'sector' ? 'Sector' : 'Asset'}
//                 </Typography>
//             </Stack>

//             <Grid
//                 container
//                 spacing={{ xs: 2, md: 3 }}
//                 columns={{ xs: 4, sm: 8, md: 12 }}
//                 sx={{ paddingY: 2, margin: 1 }}
//             >
//                 <Grid
//                     size={{ xs: 4, sm: 8, md: 3 }}
//                     sx={{ display: 'flex', justifyContent: 'center', alignItems: 'start' }}
//                 >
//                     <TextField
//                         select
//                         value={exposure}
//                         onChange={(event) => setExposure(event.target.value as 'sector' | 'asset')}
//                         label="Exposure Type"
//                         sx={{ minWidth: 120, textAlign: 'left' }}
//                     >
//                         <MenuItem value="sector">Sector</MenuItem>
//                         <MenuItem value="asset">Asset</MenuItem>
//                     </TextField>
//                 </Grid>

//                 <Grid
//                     size={{ xs: 4, sm: 8, md: 9 }}
//                     sx={{ display: 'flex', justifyContent: 'center', height: 300 }}
//                 >
//                     <PieChart
//                         series={[
//                             {
//                                 data: chartData,
//                                 ...pieChartSeriesProps,
//                             },
//                         ]}
//                         slotProps={pieChartSlotsProps}
//                     />
//                 </Grid>
//             </Grid>
//         </Paper>
//     );
// };

// export default RiskChart;


import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Box,
  Button,
} from '@mui/material';
import { PieChart as MuiPieChart, BarChart } from '@mui/x-charts';
import { PieChartRounded } from '@mui/icons-material';

// ---- Types ----
interface EnrichedHolding {
  id: number;
  asset: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  sector: string;
}

interface ChartData {
  id: number;
  label: string;
  value: number;
}

type ExposureType =
  | 'sector'
  | 'asset'
  | 'gainLoss'
  | 'returnPct'
  | 'quantity';

interface RiskChartProps {
  holdings: EnrichedHolding[];
}

const formatCurrencyShort = (value: number) => {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value}`;
};

// ---- Helper Functions ----
function getTop4Data(data: ChartData[]): { top: ChartData[]; others: ChartData[] } {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const topData = sorted.length > 4 ? sorted.slice(0, 4) : sorted;
  const others = sorted.length > 4 ? sorted.slice(4) : [];

  const result: ChartData[] = topData.map((item, index) => ({
    ...item,
    id: index,
  }));

  if (others.length) {
    const othersValue = others.reduce((sum, item) => sum + item.value, 0);
    result.push({
      id: result.length,
      label: 'Others',
      value: parseFloat(othersValue.toFixed(2)),
    });
  }

  return { top: result, others };
}

// ---- Constants ----
const COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#d32f2f', '#00897b'];

const pieChartSeriesProps = {
  innerRadius: 50,
  outerRadius: 120,
  paddingAngle: 2,
  cornerRadius: 4,
  highlightScope: { fade: 'global' as const, highlight: 'item' as const },
  faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
  cx: 150,
  cy: 150,
  valueFormatter: ({ value }: { value: number }) => `₹${value.toLocaleString()}`,
};

const pieChartSlotsProps = {
  legend: {
    direction: 'horizontal' as const,
    position: { vertical: 'bottom' as const, horizontal: 'center' as const },
    sx: {
      gap: '12px',
      '.MuiChartsLegend-series': { gap: '8px' },
    },
  },
};

// ---- Component ----
const RiskChart: React.FC<RiskChartProps> = ({ holdings }) => {
  const [exposure, setExposure] = useState<ExposureType>('sector');
  const [chartMode, setChartMode] = useState<'main' | 'drilldown'>('main');
  const [drilldownData, setDrilldownData] = useState<ChartData[]>([]);

  let rawData: ChartData[] = [];

  switch (exposure) {
    case 'sector': {
      const dataMap = holdings.reduce<Record<string, number>>((acc, h) => {
        acc[h.sector] = (acc[h.sector] || 0) + h.currentPrice * h.quantity;
        return acc;
      }, {});
      rawData = Object.entries(dataMap).map(([label, value], idx) => ({
        id: idx,
        label,
        value,
      }));
      break;
    }
    case 'asset': {
      rawData = holdings.map((h, idx) => ({
        id: idx,
        label: h.asset,
        value: h.currentPrice * h.quantity,
      }));
      break;
    }
    case 'gainLoss': {
      rawData = holdings.map((h, idx) => ({
        id: idx,
        label: h.asset,
        value: (h.currentPrice - h.avgBuyPrice) * h.quantity,
      }));
      break;
    }
    case 'returnPct': {
      rawData = holdings.map((h, idx) => ({
        id: idx,
        label: h.asset,
        value: ((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100,
      }));
      break;
    }
    case 'quantity': {
      rawData = holdings.map((h, idx) => ({
        id: idx,
        label: h.asset,
        value: h.quantity,
      }));
      break;
    }
  }

  const { top, others } = getTop4Data(rawData);

  const isPieChart = exposure === 'sector' || exposure === 'asset';
  const currentData = chartMode === 'main' ? top : drilldownData;

  const handlePieClick = (dataIndex: number) => {
    const clickedItem = currentData[dataIndex];
    if (clickedItem?.label === 'Others') {
      setDrilldownData(others.map((o, idx) => ({ ...o, id: idx })));
      setChartMode('drilldown');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
        <PieChartRounded color="primary" sx={{ fontSize: 40 }} />
        <Typography variant="h5">
          Risk Exposure - {exposure.charAt(0).toUpperCase() + exposure.slice(1)}{' '}
          {chartMode === 'drilldown' && '(Drilldown)'}
        </Typography>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ py: 3, px: 2 }}
      >
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 600 }}>
            {isPieChart ? (
              <MuiPieChart
                series={[
                  {
                    data: currentData,
                    ...pieChartSeriesProps,
                  },
                ]}
                onItemClick={(_, item) => handlePieClick(item.dataIndex)}
                slotProps={pieChartSlotsProps}
                height={350}
              />
            ) : (
              <BarChart
                series={currentData.map((d, idx) => ({
                  label: d.label,
                  data: [d.value],
                  color: COLORS[idx % COLORS.length],
                }))}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: [''],
                    label: 'Assets',
                    labelStyle: { fontWeight: 'bold', fontSize: 14 },
                    tickLabelStyle: { fontWeight: 'lighter', fontSize: 14 },
                  },
                ]}
                yAxis={[
                  {
                    label:
                      exposure === 'quantity'
                        ? 'Units Held'
                        : exposure === 'returnPct'
                        ? 'Return %'
                        : 'Value',
                    valueFormatter:
                      exposure === 'quantity' || exposure === 'returnPct'
                        ? undefined
                        : formatCurrencyShort,
                    labelStyle: { fontWeight: 'bold', fontSize: 14 },
                    tickLabelStyle: { fontWeight: 'lighter', fontSize: 12 },
                  },
                ]}
                height={350}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ minWidth: 160, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TextField
            select
            label="Exposure"
            value={exposure}
            onChange={(e) => {
              setExposure(e.target.value as ExposureType);
              setChartMode('main');
            }}
            size="small"
            fullWidth
          >
            <MenuItem value="sector">Sector</MenuItem>
            <MenuItem value="asset">Asset</MenuItem>
            <MenuItem value="gainLoss">Gain / Loss</MenuItem>
            <MenuItem value="returnPct">Profit / Loss %</MenuItem>
            <MenuItem value="quantity">Quantity Held</MenuItem>
          </TextField>

          {chartMode === 'drilldown' && (
            <Button variant="outlined" onClick={() => setChartMode('main')}>
              Back
            </Button>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

export default RiskChart;
