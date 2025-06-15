#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

interface BinanceKlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

interface BinanceTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

class BinanceMCPServer {
  private server: Server;
  private baseURL = "https://api.binance.com/api/v3";

  constructor() {
    this.server = new Server(
      {
        name: "binance-price-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_current_price",
            description: "Get current price for a cryptocurrency symbol",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Trading pair symbol (e.g., BTCUSDT, ETHUSDT)",
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "get_24hr_ticker",
            description: "Get 24hr ticker price change statistics",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Trading pair symbol (e.g., BTCUSDT, ETHUSDT)",
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "get_kline_data",
            description: "Get candlestick/kline data for a symbol with specified timeframe",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Trading pair symbol (e.g., BTCUSDT, ETHUSDT)",
                },
                interval: {
                  type: "string",
                  description: "Timeframe interval (1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M)",
                  enum: ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"],
                },
                limit: {
                  type: "number",
                  description: "Number of klines to return (default: 100, max: 1000)",
                  minimum: 1,
                  maximum: 1000,
                },
              },
              required: ["symbol", "interval"],
            },
          },
          {
            name: "get_price_history",
            description: "Get historical price data with OHLCV information",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Trading pair symbol (e.g., BTCUSDT, ETHUSDT)",
                },
                interval: {
                  type: "string",
                  description: "Timeframe interval (15m, 1h, 4h, 1d, etc.)",
                },
                limit: {
                  type: "number",
                  description: "Number of data points to return (default: 24)",
                  minimum: 1,
                  maximum: 1000,
                },
              },
              required: ["symbol", "interval"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new Error("Missing arguments");
      }

      try {
        switch (name) {
          case "get_current_price":
            return await this.getCurrentPrice(args.symbol as string);

          case "get_24hr_ticker":
            return await this.get24hrTicker(args.symbol as string);

          case "get_kline_data":
            return await this.getKlineData(
              args.symbol as string,
              args.interval as string,
              (args.limit as number) || 100
            );

          case "get_price_history":
            return await this.getPriceHistory(
              args.symbol as string,
              args.interval as string,
              (args.limit as number) || 24
            );

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async getCurrentPrice(symbol: string) {
    try {
      const response = await axios.get(`${this.baseURL}/ticker/price`, {
        params: { symbol: symbol.toUpperCase() },
      });

      const data = response.data;
      
      return {
        content: [
          {
            type: "text",
            text: `Current price for ${data.symbol}: $${parseFloat(data.price).toLocaleString()}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch current price: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async get24hrTicker(symbol: string) {
    try {
      const response = await axios.get(`${this.baseURL}/ticker/24hr`, {
        params: { symbol: symbol.toUpperCase() },
      });

      const data: BinanceTicker24hr = response.data;
      
      const priceChange = parseFloat(data.priceChange);
      const priceChangePercent = parseFloat(data.priceChangePercent);
      const currentPrice = parseFloat(data.lastPrice);
      const volume = parseFloat(data.volume);
      const high24h = parseFloat(data.highPrice);
      const low24h = parseFloat(data.lowPrice);

      return {
        content: [
          {
            type: "text",
            text: `📊 ${data.symbol} - 24hr Statistics:
            
💰 Current Price: $${currentPrice.toLocaleString()}
📈 24h Change: ${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(4)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)
🔼 24h High: $${high24h.toLocaleString()}
🔽 24h Low: $${low24h.toLocaleString()}
📊 24h Volume: ${volume.toLocaleString()} ${data.symbol.replace('USDT', '').replace('BUSD', '').replace('BTC', '').replace('ETH', '')}
💵 Quote Volume: $${parseFloat(data.quoteVolume).toLocaleString()}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch 24hr ticker: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getKlineData(symbol: string, interval: string, limit: number) {
    try {
      const response = await axios.get(`${this.baseURL}/klines`, {
        params: {
          symbol: symbol.toUpperCase(),
          interval,
          limit,
        },
      });

      const klines = response.data;
      
      if (!klines || klines.length === 0) {
        throw new Error("No kline data received");
      }

      // Parse the last few klines for display
      const lastKlines = klines.slice(-5).map((kline: any[]) => {
        const [openTime, open, high, low, close, volume] = kline;
        return {
          time: new Date(openTime).toISOString(),
          open: parseFloat(open),
          high: parseFloat(high),
          low: parseFloat(low),
          close: parseFloat(close),
          volume: parseFloat(volume),
        };
      });

      const latestKline = lastKlines[lastKlines.length - 1];

      return {
        content: [
          {
            type: "text",
            text: `📈 ${symbol.toUpperCase()} Kline Data (${interval} interval, last ${limit} periods):

Latest Candle:
🕐 Time: ${latestKline.time}
🟢 Open: $${latestKline.open.toLocaleString()}
🔴 Close: $${latestKline.close.toLocaleString()}
🔼 High: $${latestKline.high.toLocaleString()}
🔽 Low: $${latestKline.low.toLocaleString()}
📊 Volume: ${latestKline.volume.toLocaleString()}

Recent 5 candles:
${lastKlines.map((k: any) => 
  `${new Date(k.time).toLocaleString()}: O:${k.open.toFixed(2)} H:${k.high.toFixed(2)} L:${k.low.toFixed(2)} C:${k.close.toFixed(2)}`
).join('\n')}

Total data points received: ${klines.length}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch kline data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getPriceHistory(symbol: string, interval: string, limit: number) {
    try {
      const response = await axios.get(`${this.baseURL}/klines`, {
        params: {
          symbol: symbol.toUpperCase(),
          interval,
          limit,
        },
      });

      const klines = response.data;
      
      if (!klines || klines.length === 0) {
        throw new Error("No historical data received");
      }

      const historicalData = klines.map((kline: any[], index: number) => {
        const [openTime, open, high, low, close, volume] = kline;
        return {
          period: index + 1,
          timestamp: new Date(openTime).toISOString(),
          open: parseFloat(open),
          high: parseFloat(high),
          low: parseFloat(low),
          close: parseFloat(close),
          volume: parseFloat(volume),
          change: index > 0 ? 
            ((parseFloat(close) - parseFloat(klines[index - 1][4])) / parseFloat(klines[index - 1][4]) * 100) : 0
        };
      });

      const latest = historicalData[historicalData.length - 1];
      const oldest = historicalData[0];
      const totalChange = ((latest.close - oldest.open) / oldest.open * 100);

      return {
        content: [
          {
            type: "text",
            text: `📊 ${symbol.toUpperCase()} Price History (${interval} intervals, ${limit} periods):

📈 Summary:
• Period: ${oldest.timestamp.split('T')[0]} to ${latest.timestamp.split('T')[0]}
• Starting Price: $${oldest.open.toLocaleString()}
• Current Price: $${latest.close.toLocaleString()}
• Total Change: ${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%
• Highest: ${Math.max(...historicalData.map((d: any) => d.high)).toLocaleString()}
• Lowest: ${Math.min(...historicalData.map((d: any) => d.low)).toLocaleString()}

📋 Recent 10 periods:
${historicalData.slice(-10).map((d: any) => 
  `${d.timestamp.split('T')[0]} ${d.timestamp.split('T')[1].split('.')[0]}: ${d.close.toFixed(2)} (${d.change >= 0 ? '+' : ''}${d.change.toFixed(2)}%)`
).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch price history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Binance MCP server running on stdio");
  }
}

const server = new BinanceMCPServer();
server.run().catch(console.error);