# Binance MCP Server

A Model Context Protocol (MCP) server that provides access to Binance cryptocurrency price data for use with Claude Desktop.

## Features

- **Current Price**: Get real-time price for any trading pair
- **24hr Ticker**: Get comprehensive 24-hour statistics including price change, volume, and high/low
- **Kline Data**: Fetch candlestick/OHLCV data with customizable timeframes
- **Price History**: Get historical price data with trend analysis

## Supported Timeframes

- `1m`, `3m`, `5m`, `15m`, `30m` (minutes)
- `1h`, `2h`, `4h`, `6h`, `8h`, `12h` (hours)  
- `1d`, `3d` (days)
- `1w` (week)
- `1M` (month)

## Installation

1. Clone or download this project
2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Setup with Claude Desktop

1. Open your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server configuration:
```json
{
  "mcpServers": {
    "binance-price": {
      "command": "node",
      "args": ["/path/to/your/binance-mcp-server/dist/index.js"]
    }
  }
}
```

3. Replace `/path/to/your/binance-mcp-server` with the actual path to your project directory.

4. Restart Claude Desktop

## Usage

Once set up, you can use these commands in Claude Desktop:

### Get Current Price
```
What's the current price of BTCUSDT?
```

### Get 24hr Statistics
```
Show me the 24hr ticker for ETHUSDT
```

### Get Kline/Candlestick Data
```
Get 1h kline data for BTCUSDT with 50 periods
```

### Get Price History
```
Show me the price history for ADAUSDT on 4h timeframe for the last 24 periods
```

## Available Tools

### 1. get_current_price
- **Purpose**: Get the current price for a trading pair
- **Parameters**: 
  - `symbol` (required): Trading pair (e.g., "BTCUSDT", "ETHUSDT")

### 2. get_24hr_ticker  
- **Purpose**: Get 24-hour price change statistics
- **Parameters**:
  - `symbol` (required): Trading pair (e.g., "BTCUSDT", "ETHUSDT")

### 3. get_kline_data
- **Purpose**: Get candlestick/kline data
- **Parameters**:
  - `symbol` (required): Trading pair (e.g., "BTCUSDT", "ETHUSDT") 
  - `interval` (required): Timeframe (e.g., "15m", "1h", "4h", "1d")
  - `limit` (optional): Number of klines (default: 100, max: 1000)

### 4. get_price_history
- **Purpose**: Get historical price data with analysis
- **Parameters**:
  - `symbol` (required): Trading pair (e.g., "BTCUSDT", "ETHUSDT")
  - `interval` (required): Timeframe (e.g., "15m", "1h", "4h", "1d")  
  - `limit` (optional): Number of periods (default: 24)

## Example Symbols

- `BTCUSDT` - Bitcoin/USDT
- `ETHUSDT` - Ethereum/USDT  
- `BNBUSDT` - Binance Coin/USDT
- `ADAUSDT` - Cardano/USDT
- `SOLUSDT` - Solana/USDT
- `DOTUSDT` - Polkadot/USDT

## Error Handling

The server includes comprehensive error handling for:
- Invalid symbols
- Network connectivity issues
- API rate limits
- Invalid timeframes
- Missing data

## Development

To run in development mode:
```bash
npm run dev
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for building servers
- `axios`: HTTP client for Binance API requests
- `typescript`: TypeScript compiler
- `tsx`: TypeScript execution engine

## API Rate Limits

This server uses Binance's public API endpoints which have the following limits:
- 1200 requests per minute
- 10 requests per second per IP

The server does not implement rate limiting, so use responsibly.

## License

MIT License

## Troubleshooting

1. **Server not appearing in Claude Desktop**: 
   - Check the file path in your configuration
   - Ensure the build was successful (`npm run build`)
   - Restart Claude Desktop after configuration changes

2. **API Errors**:
   - Verify symbol format (e.g., "BTCUSDT" not "BTC-USDT")
   - Check your internet connection
   - Ensure you're not hitting rate limits

3. **Build Errors**:
   - Run `npm install` to ensure all dependencies are installed
   - Check that you have Node.js v18+ installed