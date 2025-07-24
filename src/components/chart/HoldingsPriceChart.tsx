import React, { useState, useMemo } from 'react';
import {
    Paper,
    Typography,
    Box,
    TextField,
    InputAdornment,
    Divider,
    Grid,
    Pagination,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import type { EnrichedHolding } from '../../data/mockData'

interface Props {
    holdings: EnrichedHolding[];
}

const generatePriceHistory = (startPrice: number, endPrice: number, months: number ) => {
    const history = [];
    let price = (startPrice + endPrice)/2;
    
    let date = new Date();
    date.setMonth(date.getMonth() - (months + 1));
    history.push({
        date: date.toISOString().slice(0, 10),
        price: startPrice,
    });
    for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (months - i));
        const changePercent = Math.random() * 0.2 - 0.1;
        price = price * (1 + changePercent);
        history.push({
            date: date.toISOString().slice(0, 10),
            price: parseFloat(price.toFixed(2)),
        });
    }
    date = new Date();
    history.push({
        date: date.toISOString().slice(0, 10),
        price: endPrice,
    });
    console.log(history);
    return history;
};

const Sparkline: React.FC<{
    data: { price: number; date?: string }[];
    width?: number;
    height?: number;
}> = ({ data, width = 500, height = 250 }) => {
    const max = Math.max(...data.map(d => d.price));
    const min = Math.min(...data.map(d => d.price));
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const getX = (i: number) =>
        padding + (i / (data.length - 1)) * chartWidth;
    const getY = (price: number) =>
        padding + chartHeight - ((price - min) / (max - min)) * chartHeight;

    const linePath = data
        .map((d, i) => `${getX(i)},${getY(d.price)}`)
        .join(" ");

    const isUp = data[data.length - 1].price >= data[0].price;
    const lineColor = isUp ? "#2e7d32" : "#c62828";

    return (
        <svg width={width} height={height} style={{ border: "1px solid #ccc" }}>
            {/* Y Axis */}
            <line
                x1={padding}
                y1={padding}
                x2={padding}
                y2={height - padding}
                stroke="#ccc"
            />

            {/* X Axis */}
            <line
                x1={padding}
                y1={height - padding}
                x2={width - padding}
                y2={height - padding}
                stroke="#ccc"
            />

            {/* Y Axis Labels */}
            <text x={5} y={padding + 5} fontSize="10">₹{max.toFixed(0)}</text>
            <text x={5} y={height - padding} fontSize="10">₹{min.toFixed(0)}</text>

            {/* X Axis Labels */}
            <text x={padding} y={height - 5} fontSize="10">12M Ago</text>
            <text x={width - padding - 20} y={height - 5} fontSize="10">Now</text>

            {/* Axis Titles */}
            <text x={10} y={height / 2} fontSize="12" transform={`rotate(-90, 10, ${height / 2})`} fill="#666">
                Price (₹)
            </text>
            <text x={width / 2} y={height - 2} fontSize="12" textAnchor="middle" fill="#666">
                Time (Months)
            </text>

            {/* Price Line */}
            <polyline
                fill="none"
                stroke={lineColor}
                strokeWidth="2"
                points={linePath}
            />

            {/* Circles */}
            {data.map((point, i) => (
                <circle
                    key={i}
                    cx={getX(i)}
                    cy={getY(point.price)}
                    r={4}
                    fill={i === hoveredIndex ? "#d32f2f" : lineColor}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                />
            ))}

            {/* Tooltip */}
            {hoveredIndex !== null && (
                <>
                    <rect
                        x={getX(hoveredIndex) - 40}
                        y={getY(data[hoveredIndex].price) - 45}
                        width={80}
                        height={30}
                        rx={4}
                        ry={4}
                        fill="#000"
                        opacity={0.75}
                    />
                    <text
                        x={getX(hoveredIndex)}
                        y={getY(data[hoveredIndex].price) - 32}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="10"
                    >
                        {data[hoveredIndex].date}
                    </text>
                    <text
                        x={getX(hoveredIndex)}
                        y={getY(data[hoveredIndex].price) - 20}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="10"
                    >
                        ₹{data[hoveredIndex].price.toFixed(2)}
                    </text>
                </>
            )}
        </svg>
    );
};


const ITEMS_PER_PAGE = 2;

const HoldingsPriceChart: React.FC<Props> = ({ holdings }) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const filteredHoldings = useMemo(() =>
        holdings.filter(h => h.asset.toLowerCase().includes(search.toLowerCase())),
        [search, holdings]
    );

    const paginatedHoldings = filteredHoldings.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const totalPages = Math.ceil(filteredHoldings.length / ITEMS_PER_PAGE);

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            {/* Title + Search */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                mb={3}
            >
                <Typography variant="h5" sx={{ mb: { xs: 1, sm: 0 } }}>
                    Stock Price Trends
                </Typography>
                <TextField
                    size="small"
                    placeholder="Search Asset"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        )
                    }}
                    sx={{ width: 300 }}
                />
            </Box>
    
            {/* Graphs (side by side) */}
            <Grid container spacing={3} mb={3}>
                {paginatedHoldings.map((holding) => {
                    const priceHistory = generatePriceHistory(holding.avgBuyPrice, holding.currentPrice, 12);
                    return (
                        <Grid size={{ xs: 12, md: 6 }} key={holding.id}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {holding.asset}
                            </Typography>
                            <Sparkline data={priceHistory} />
                            <Divider sx={{ mt: 1 }} />
                        </Grid>
                    );
                })}
            </Grid>
    
            {/* Pagination */}
            {totalPages > 1 && (
                <Box display="flex" justifyContent="center">
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                    />
                </Box>
            )}
        </Paper>
    );
    
};

export default HoldingsPriceChart;
