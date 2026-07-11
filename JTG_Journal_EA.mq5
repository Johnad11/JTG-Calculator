//+------------------------------------------------------------------+
//|                                              JTG_Journal_EA.mq5  |
//|                                  Copyright 2026, JTG Ecosystem   |
//|                                     https://jtg-ecosystem.app/   |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, JTG Ecosystem"
#property link      "https://jtgjournal.johnadtradersgroup.name.ng/"
#property version   "1.10"
#property strict
#property description "Advanced Standalone JTG Journal for MT5"

#include <Canvas\Canvas.mqh>

//--- Compatibility Helpers
int TimeMonth(datetime t) { MqlDateTime dt; TimeToStruct(t, dt); return dt.mon; }
int TimeHour(datetime t)  { MqlDateTime dt; TimeToStruct(t, dt); return dt.hour; }
int TimeDay(datetime t)   { MqlDateTime dt; TimeToStruct(t, dt); return dt.day; }

//--- ENUMS
enum ENUM_TAB { TAB_OVERVIEW, TAB_STATS, TAB_CALENDAR, TAB_HISTORY, TAB_CALC, TAB_ECOSYSTEM };

//--- INPUT PARAMETERS
input string         InpTerminalKey = "JTG-XXXX-XXXX"; // Sync Key (Optional)
input string         InpSyncUrl     = "https://jtgjournal.johnadtradersgroup.name.ng/api/sync"; // Sync Endpoint URL
input ENUM_BASE_CORNER InpCorner    = CORNER_RIGHT_UPPER; // Dock Corner
input color          InpMainColor   = C'0, 255, 136';   // Electric Green
input color          InpBgColor     = C'13, 17, 23';    // Deep Navy
input int            InpRefreshSec  = 5;                // Update Rate (Sec)

//--- PREMIUM UI CONSTANTS
#define CLR_ACCENT_BLUE ARGB_Helper(C'88, 166, 255')
#define CLR_GLOW_GREEN  ARGB_Helper(C'0, 255, 136', 40)
#define PANEL_PADDING   15

//--- STRUCTS
struct TradeRecord {
   ulong    ticket;
   string   symbol;
   double   volume;
   double   pnl;
   datetime closeTime;
   uchar    type; // 0=Buy, 1=Sell
};

struct BalanceRecord {
   ulong    ticket;
   double   amount;
   datetime time;
};

//--- GLOBAL VARIABLES
CCanvas        Canvas;
ENUM_TAB       CurrentTab = TAB_OVERVIEW;
string         AccountCurrency = "USD";
TradeRecord    HistoryData[];
BalanceRecord  BalanceData[];
double         EquityCurve[];
double         DailyPnL[32]; // Max 31 days
double         HourlyPnL[24];
double         SessionPnL[3]; // 0=Tokyo, 1=London, 2=NY
int            CurrentMonth = 0;
string         LastSyncTime = "Never";
string         SyncStatus = "Idle";
int            GlobalMouseX = 0;
int            GlobalMouseY = 0;

//--- WINDOW WINDOWING STATE
bool           IsDocked = true;
bool           IsMinimized = false;
bool           IsDragging = false;
int            DragOffsetX = 0;
int            DragOffsetY = 0;
int            FloatingX = 100;
int            FloatingY = 100;

//--- Advanced Stats
double         StatExpectancy = 0;
double         StatSharpe = 0;
double         StatProfitFactor = 0;
string         StatBestPair = "N/A";

//--- Calculator State
double         CalcEntry = 0;
double         CalcSL = 0;
double         CalcRiskPct = 1.0;
double         CalcResultLot = 0;

//--- DASHBOARD DIMENSIONS
#define PANEL_W 380
#define PANEL_H 640

//+------------------------------------------------------------------+
//| Helper: ARGB Conversion                                         |
//+------------------------------------------------------------------+
uint ARGB_Helper(color clr, uchar alpha=255) 
{ 
   uint r = (uint)(clr & 0xFF);
   uint g = (uint)((clr >> 8) & 0xFF);
   uint b = (uint)((clr >> 16) & 0xFF);
   return((uint)alpha<<24 | (r<<16) | (g<<8) | b); 
}

//--- UI Helper: Rounded Rectangle
void DrawRoundedRect(int x1, int y1, int x2, int y2, int r, uint clr, bool fill=true)
{
   if(fill) Canvas.FillRectangle(x1+r, y1, x2-r, y2, clr);
   if(fill) Canvas.FillRectangle(x1, y1+r, x2, y2-r, clr);
   Canvas.Pie(x1, y1, x1+2*r, y1+2*r, x1+r, y1, x1, y1+r, clr, fill?clr:0);
   Canvas.Pie(x2-2*r, y1, x2, y1+2*r, x2, y1+r, x2-r, y1, clr, fill?clr:0);
   Canvas.Pie(x1, y2-2*r, x1+2*r, y2, x1, y2-r, x1+r, y2, clr, fill?clr:0);
   Canvas.Pie(x2-2*r, y2-2*r, x2, y2, x2-r, y2, x2, y2-r, clr, fill?clr:0);
}

//--- UI Helper: Linear Gradient
void DrawGradientRect(int x1, int y1, int x2, int y2, uint clr1, uint clr2, bool vertical=true)
{
   int steps = vertical ? (y2 - y1) : (x2 - x1);
   if(steps <= 0) return;
   
   uchar r1 = (uchar)(clr1 >> 16), g1 = (uchar)(clr1 >> 8), b1 = (uchar)clr1, a1 = (uchar)(clr1 >> 24);
   uchar r2 = (uchar)(clr2 >> 16), g2 = (uchar)(clr2 >> 8), b2 = (uchar)clr2, a2 = (uchar)(clr2 >> 24);
   
   for(int i=0; i<steps; i++)
   {
      double ratio = (double)i / steps;
      uchar r = (uchar)(r1 + (r2 - r1) * ratio);
      uchar g = (uchar)(g1 + (g2 - g1) * ratio);
      uchar b = (uchar)(b1 + (b2 - b1) * ratio);
      uchar a = (uchar)(a1 + (a2 - a1) * ratio);
      uint clr = (uint)a << 24 | (uint)r << 16 | (uint)g << 8 | (uint)b;
      
      if(vertical) Canvas.Line(x1, y1+i, x2, y1+i, clr);
      else Canvas.Line(x1+i, y1, x1+i, y2, clr);
   }
}

//--- UI Helper: Glass Panel
void DrawGlassPanel(int x, int y, int w, int h, int r=12)
{
   DrawRoundedRect(x, y, x+w, y+h, r, ARGB_Helper(C'33, 38, 45', 100), true);
   DrawRoundedRect(x, y, x+w, y+h, r, ARGB_Helper(C'48, 54, 61', 150), false);
}

//--- UI Helper: Area Chart
void DrawAreaChart(int x, int y, int w, int h, double &data[])
{
   int size = ArraySize(data);
   if(size < 2) return;
   
   double maxV = data[0], minV = data[0];
   for(int i=0; i<size; i++) {
      if(data[i] > maxV) maxV = data[i];
      if(data[i] < minV) minV = data[i];
   }
   double diff = (maxV - minV == 0) ? 1 : (maxV - minV);
   
   // 1. Draw Area Gradient
   for(int i=1; i<size; i++)
   {
      int x1 = x + (int)(((double)(i-1)/(size-1)) * w);
      int y1 = y + h - (int)(((data[i-1] - minV)/diff) * h);
      int x2 = x + (int)(((double)i/(size-1)) * w);
      int y2 = y + h - (int)(((data[i] - minV)/diff) * h);
      
      // Vertical strips for area fill
      for(int sx = x1; sx < x2; sx++)
      {
         double r = (double)(sx - x1) / (x2 - x1);
         int sy = (int)(y1 + (y2 - y1) * r);
         Canvas.Line(sx, sy, sx, y+h, ARGB_Helper(InpMainColor, 40));
      }
      
      // 2. Main Line
      Canvas.Line(x1, y1, x2, y2, ARGB_Helper(InpMainColor));
   }
}

//+------------------------------------------------------------------+
//| Update Dashboard Position and Size                               |
//+------------------------------------------------------------------+
void UpdateDashboardSize()
{
   int activeW = IsMinimized ? 160 : PANEL_W;
   int activeH = IsMinimized ? 45 : PANEL_H;
   
   ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_XSIZE, activeW);
   ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_YSIZE, activeH);
   
   if(IsDocked)
   {
      ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_CORNER, InpCorner);
      ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_XDISTANCE, 10);
      ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_YDISTANCE, 30);
   }
   else
   {
      ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_XDISTANCE, FloatingX);
      ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_YDISTANCE, FloatingY);
   }
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   AccountCurrency = AccountInfoString(ACCOUNT_CURRENCY);
   CurrentMonth = TimeMonth(TimeCurrent());
   
   // Create Canvas
   int x = (InpCorner == CORNER_RIGHT_UPPER || InpCorner == CORNER_RIGHT_LOWER) ? 10 : 10;
   if(!Canvas.CreateBitmapLabel("JTG_Advanced_Dashboard", 10, 30, PANEL_W, PANEL_H, COLOR_FORMAT_XRGB_NOALPHA))
   {
      Print("JTG Error: Canvas creation failed.");
      return(INIT_FAILED);
   }
   
   ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_CORNER, InpCorner);
   ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_BACK, false); // Render in foreground (in front of candles!)
   ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, "JTG_Advanced_Dashboard", OBJPROP_SELECTED, false);
   
   // Enable mouse tracking to capture coordinates on foreground canvas clicks
   ChartSetInteger(0, CHART_EVENT_MOUSE_MOVE, true);
   
   UpdateDashboardSize();
   
   EventSetTimer(InpRefreshSec);
   FullHistoryScan();
   DrawUI();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Deinit                                                           |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Canvas.Destroy();
   EventKillTimer();
}

//+------------------------------------------------------------------+
//| Timer                                                            |
//+------------------------------------------------------------------+
void OnTimer()
{
   FullHistoryScan();
   DrawUI();
}

//+------------------------------------------------------------------+
//| Full History Scan Logic                                          |
//+------------------------------------------------------------------+
void FullHistoryScan()
{
   HistorySelect(0, TimeCurrent());
   int totalDeals = HistoryDealsTotal();
   
   ArrayFree(HistoryData);
   ArrayFree(EquityCurve);
   ArrayFree(BalanceData);
   ArrayFill(DailyPnL, 0, 32, 0);
   ArrayFill(HourlyPnL, 0, 24, 0);
   ArrayFill(SessionPnL, 0, 3, 0);
   
   double runningPnL = 0;
   ArrayResize(EquityCurve, 1);
   EquityCurve[0] = 0;
   
   int recordIdx = 0;
   int balanceIdx = 0;
   double grossProfit = 0, grossLoss = 0;
   int wins = 0, losses = 0;
   
   // For Sharpe Ratio
   double returns[];
   ArrayResize(returns, 0);
   
   for(int i=0; i<totalDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
      
      if(dealType == DEAL_TYPE_BALANCE)
      {
         double amount = HistoryDealGetDouble(ticket, DEAL_PROFIT);
         datetime bTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         
         ArrayResize(BalanceData, balanceIdx + 1);
         BalanceData[balanceIdx].ticket = ticket;
         BalanceData[balanceIdx].amount = amount;
         BalanceData[balanceIdx].time = bTime;
         balanceIdx++;
      }
      else if(HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT)
      {
         double pnl = HistoryDealGetDouble(ticket, DEAL_PROFIT);
         double comm = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
         double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
         double net = pnl + comm + swap;
         
         datetime cTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         int hour = TimeHour(cTime);
         
         // 1. Update Equity & Stats
         runningPnL += net;
         int eqSize = ArraySize(EquityCurve);
         ArrayResize(EquityCurve, eqSize + 1);
         EquityCurve[eqSize] = runningPnL;
         
         if(net > 0) { wins++; grossProfit += net; }
         else if(net < 0) { losses++; grossLoss += MathAbs(net); }
         
         int retSize = ArraySize(returns);
         ArrayResize(returns, retSize + 1);
         returns[retSize] = net;
         
         // 2. Heatmaps
         HourlyPnL[hour] += net;
         
         // Sessions (Approx GMT/Server times - usually server is GMT+2/3)
         if(hour >= 0 && hour < 8) SessionPnL[0] += net; // Tokyo/Asia
         else if(hour >= 8 && hour < 13) SessionPnL[1] += net; // London
         else if(hour >= 13 && hour < 21) SessionPnL[2] += net; // NY
         else SessionPnL[0] += net; // Late Asia
         
         if(TimeMonth(cTime) == CurrentMonth)
          {
             int day = TimeDay(cTime);
             if(day >= 1 && day <= 31) DailyPnL[day] += net;
          }
         
         // 3. Store History Record
         ArrayResize(HistoryData, recordIdx + 1);
         HistoryData[recordIdx].ticket = ticket;
         HistoryData[recordIdx].symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
         HistoryData[recordIdx].volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
         HistoryData[recordIdx].pnl = net;
         HistoryData[recordIdx].closeTime = cTime;
         HistoryData[recordIdx].type = (uchar)dealType;
         recordIdx++;
      }
   }
   
   // Final Stat Calculations
   int totalTrades = ArraySize(HistoryData);
   if(totalTrades > 0)
   {
      double winRate = (double)wins/totalTrades;
      double avgWin = (wins > 0) ? grossProfit/wins : 0;
      double avgLoss = (losses > 0) ? grossLoss/losses : 0;
      
      StatExpectancy = (winRate * avgWin) - ((1.0 - winRate) * avgLoss);
      StatProfitFactor = (grossLoss > 0) ? grossProfit / grossLoss : (grossProfit > 0 ? 99.9 : 0);
      
      // Simplified Sharpe
      double sum = 0;
      for(int i=0; i<totalTrades; i++) sum += returns[i];
      double mean = sum / totalTrades;
      double varSum = 0;
      for(int i=0; i<totalTrades; i++) varSum += MathPow(returns[i] - mean, 2);
      double stdDev = MathSqrt(varSum / totalTrades);
      StatSharpe = (stdDev > 0) ? (mean / stdDev) : 0;
   }
}

//+------------------------------------------------------------------+
//| Draw Premium Minimized Capsule UI                                |
//+------------------------------------------------------------------+
void DrawMinimizedUI()
{
   Canvas.Erase(ARGB_Helper(InpBgColor));
   
   // Premium Glowing Green Border
   Canvas.Rectangle(0, 0, 159, 44, ARGB_Helper(InpMainColor, 100));
   
   // Electric green left accent bar
   Canvas.FillRectangle(0, 0, 4, 44, ARGB_Helper(InpMainColor));
   
   // Glow behind the text
   Canvas.FontSet("Outfit", 9, FW_BOLD);
   Canvas.TextOut(15, 16, "JTG EVOLUTION", CLR_GLOW_GREEN);
   Canvas.TextOut(15, 15, "JTG EVOLUTION", ARGB_Helper(clrWhite));
   
   // Premium Restore Button [+] (Rounded capsule look)
   int btnX1 = 125, btnY1 = 10, btnSz = 24;
   DrawRoundedRect(btnX1, btnY1, btnX1 + btnSz, btnY1 + btnSz, 4, ARGB_Helper(C'48, 54, 61', 150), true);
   DrawRoundedRect(btnX1, btnY1, btnX1 + btnSz, btnY1 + btnSz, 4, ARGB_Helper(InpMainColor, 80), false);
   Canvas.FontSet("Outfit", 12, FW_BOLD);
   Canvas.TextOut(btnX1 + 6, btnY1 + 2, "+", ARGB_Helper(clrWhite));
   
   Canvas.Update();
}

//+------------------------------------------------------------------+
//| Main Draw UI Orchestrator                                        |
//+------------------------------------------------------------------+
void DrawUI()
{
   if(IsMinimized)
   {
      DrawMinimizedUI();
      return;
   }
   
   Canvas.Erase(ARGB_Helper(InpBgColor));
   Canvas.Rectangle(0, 0, PANEL_W-1, PANEL_H-1, ARGB_Helper(InpMainColor, 100));
   
   DrawHeader();
   DrawTabs();
   
   switch(CurrentTab)
   {
      case TAB_OVERVIEW:  DrawTabOverview(); break;
      case TAB_STATS:     DrawTabStats();    break;
      case TAB_CALENDAR:  DrawTabCalendar(); break;
      case TAB_HISTORY:   DrawTabHistory();  break;
      case TAB_CALC:      DrawTabCalc();     break;
      case TAB_ECOSYSTEM: DrawTabEcosystem(); break;
      default:            DrawTabOverview();  break; // Safety fallback
   }
   
   DrawFooter();
   Canvas.Update();
}

//--- Section: Header
void DrawHeader()
{
   DrawGradientRect(0, 0, PANEL_W, 70, ARGB_Helper(InpMainColor, 180), ARGB_Helper(C'13, 17, 23', 255), true);
   
   // Glow effect
   Canvas.FontSet("Outfit", 22, FW_BOLD);
   Canvas.TextOut(20, 20, "JTG EVOLUTION", CLR_GLOW_GREEN);
   Canvas.TextOut(20, 19, "JTG EVOLUTION", ARGB_Helper(clrWhite));
   
   Canvas.FontSet("Outfit", 10, FW_NORMAL);
   Canvas.TextOut(250, 28, AccountCurrency, ARGB_Helper(clrWhite, 150));
   
   // Draw Minimize Button [-]
   int minBtnX = 310, minBtnY = 23, btnSz = 24;
   DrawRoundedRect(minBtnX, minBtnY, minBtnX + btnSz, minBtnY + btnSz, 4, ARGB_Helper(C'48, 54, 61', 150), true);
   DrawRoundedRect(minBtnX, minBtnY, minBtnX + btnSz, minBtnY + btnSz, 4, ARGB_Helper(InpMainColor, 80), false);
   Canvas.FontSet("Outfit", 12, FW_BOLD);
   Canvas.TextOut(minBtnX + 8, minBtnY + 2, "-", ARGB_Helper(clrWhite));
   
   // Draw Dock/Pin Button [P/F]
   int dockBtnX = 342, dockBtnY = 23;
   DrawRoundedRect(dockBtnX, dockBtnY, dockBtnX + btnSz, dockBtnY + btnSz, 4, ARGB_Helper(C'48, 54, 61', 150), true);
   DrawRoundedRect(dockBtnX, dockBtnY, dockBtnX + btnSz, dockBtnY + btnSz, 4, ARGB_Helper(InpMainColor, 80), false);
   
   string pinChar = IsDocked ? "P" : "F";
   Canvas.FontSet("Outfit", 10, FW_BOLD);
   Canvas.TextOut(dockBtnX + 8, dockBtnY + 4, pinChar, IsDocked ? ARGB_Helper(InpMainColor) : ARGB_Helper(clrWhite));
   
   Canvas.Line(0, 70, PANEL_W, 70, ARGB_Helper(InpMainColor, 80));
}

//--- Section: Tab Bar
void DrawTabs()
{
   string labels[] = {"DASH", "STAT", "CAL", "LOGS", "RISK", "JTG"};
   int tw = (PANEL_W - 40) / 6;
   int startX = 20;
   
   for(int i=0; i<6; i++)
   {
      bool active = (CurrentTab == (ENUM_TAB)i);
      int tx = startX + i*tw;
      
      if(active) {
         DrawRoundedRect(tx, 80, tx+tw-5, 110, 5, ARGB_Helper(InpMainColor, 40), true);
         DrawRoundedRect(tx, 80, tx+tw-5, 110, 5, ARGB_Helper(InpMainColor, 180), false);
      }
      
      Canvas.FontSet("Outfit", 10, active ? FW_BOLD : FW_NORMAL);
      Canvas.TextOut(tx + (tw/2) - 13, 89, labels[i], active ? ARGB_Helper(clrWhite) : ARGB_Helper(clrSlateGray));
   }
}

//--- Tab: Overview
void DrawTabOverview()
{
   int eqSize = ArraySize(EquityCurve);
   double totalPnL = (eqSize > 0) ? EquityCurve[eqSize-1] : 0;
   int wins = 0;
   for(int i=0; i<ArraySize(HistoryData); i++) if(HistoryData[i].pnl > 0) wins++;
   double winRate = (ArraySize(HistoryData) > 0) ? (double)wins/ArraySize(HistoryData)*100 : 0;
   
   int y = 125;
   DrawGlassPanel(20, y, 340, 90, 15);
   
   Canvas.FontSet("Outfit", 11, FW_NORMAL);
   Canvas.TextOut(40, y+16, "NET PROFIT (" + AccountCurrency + ")", ARGB_Helper(clrSlateGray));
   Canvas.FontSet("Outfit", 32, FW_BOLD);
   uint pnlClr = totalPnL >= 0 ? ARGB_Helper(InpMainColor) : ARGB_Helper(clrRed);
   Canvas.TextOut(40, y+38, (totalPnL >= 0 ? "+" : "") + DoubleToString(totalPnL, 2), pnlClr);
   
   // Summary Stats Line
   int sy = y + 105;
   DrawRoundedRect(20, sy, 185, sy+60, 10, ARGB_Helper(C'33, 38, 45', 80));
   DrawRoundedRect(195, sy, 360, sy+60, 10, ARGB_Helper(C'33, 38, 45', 80));
   
   Canvas.FontSet("Outfit", 9, FW_NORMAL);
   Canvas.TextOut(35, sy+12, "WIN RATE", ARGB_Helper(clrSlateGray));
   Canvas.TextOut(210, sy+12, "TOTAL TRADES", ARGB_Helper(clrSlateGray));
   
   Canvas.FontSet("Outfit", 15, FW_BOLD);
   Canvas.TextOut(35, sy+32, DoubleToString(winRate, 1) + "%", ARGB_Helper(clrWhite));
   Canvas.TextOut(210, sy+32, (string)ArraySize(HistoryData), ARGB_Helper(clrWhite));
   
   // Equity Chart
   int ey = sy + 75;
   Canvas.FontSet("Outfit", 10, FW_BOLD);
   Canvas.TextOut(20, ey, "EQUITY EVOLUTION", ARGB_Helper(clrWhite));
   DrawAreaChart(20, ey+22, 340, 180, EquityCurve);
}

//--- Tab: Statistics
void DrawTabStats()
{
   int y = 125;
   int eqSize = ArraySize(EquityCurve);
   double currentPnL = (eqSize > 0) ? EquityCurve[eqSize-1] : 0;
   double bal = AccountInfoDouble(ACCOUNT_BALANCE);
   double growth = (bal > 0) ? (currentPnL / bal * 100) : 0;
   
   Canvas.FontSet("Outfit", 11, FW_BOLD);
   Canvas.TextOut(20, y, "PERFORMANCE ANALYTICS", ARGB_Helper(clrWhite));
   
   // Stat Grid
   DrawStatBox(20, y+25, 165, 65, "EXPECTANCY", DoubleToString(StatExpectancy, 2));
   DrawStatBox(195, y+25, 165, 65, "SHARPE RATIO", DoubleToString(StatSharpe, 2));
   DrawStatBox(20, y+100, 165, 65, "PROFIT FACTOR", DoubleToString(StatProfitFactor, 2));
   DrawStatBox(195, y+100, 165, 65, "GROWTH", DoubleToString(growth, 1) + "%");
   
   // Heatmaps
   int hy = y + 185;
   Canvas.FontSet("Outfit", 9, FW_BOLD);
   Canvas.TextOut(20, hy, "HOURLY DISTRIBUTION", ARGB_Helper(clrSlateGray));
   DrawBarChart(20, hy+20, 340, 80, HourlyPnL);
   
   Canvas.FontSet("Outfit", 9, FW_BOLD);
   Canvas.TextOut(20, hy+120, "SESSION ANALYTICS", ARGB_Helper(clrSlateGray));
   string sessionLabs[] = {"ASIA", "LDN", "NY"};
   int barW = (340 - 20) / 3;
   for(int i=0; i<3; i++) {
      int bx = 20 + i*(barW+10);
      DrawGlassPanel(bx, hy+138, barW, 55, 8);
      Canvas.FontSet("Outfit", 8, FW_NORMAL);
      Canvas.TextOut(bx + (barW/2) - 15, hy+144, sessionLabs[i], ARGB_Helper(clrSlateGray));
      uint col = SessionPnL[i] >= 0 ? ARGB_Helper(InpMainColor) : ARGB_Helper(clrRed);
      Canvas.FontSet("Outfit", 11, FW_BOLD);
      string valStr = (SessionPnL[i] >= 0 ? "+" : "") + DoubleToString(SessionPnL[i], 0);
      Canvas.TextOut(bx + (barW/2) - 20, hy+162, valStr, col);
   }
}

void DrawStatBox(int x, int y, int w, int h, string label, string value)
{
   DrawGlassPanel(x, y, w, h, 10);
   Canvas.FontSet("Outfit", 9, FW_NORMAL);
   Canvas.TextOut(x+15, y+12, label, ARGB_Helper(clrSlateGray));
   Canvas.FontSet("Outfit", 15, FW_BOLD);
   Canvas.TextOut(x+15, y+32, value, ARGB_Helper(clrWhite));
   
   // Accent line
   Canvas.Line(x+5, y+15, x+5, y+48, ARGB_Helper(InpMainColor, 150));
}

void DrawBarChart(int x, int y, int w, int h, double &data[])
{
   int size = ArraySize(data);
   double maxV = 0.001;
   for(int i=0; i<size; i++) if(MathAbs(data[i]) > maxV) maxV = MathAbs(data[i]);
   
   int bw = w / size;
   for(int i=0; i<size; i++)
   {
      int barH = (int)((MathAbs(data[i])/maxV) * (h/2));
      uint col = data[i] >= 0 ? ARGB_Helper(clrLime, 180) : ARGB_Helper(clrRed, 180);
      if(data[i] >= 0)
         Canvas.FillRectangle(x + i*bw, y + (h/2) - barH, x + (i+1)*bw - 1, y + (h/2), col);
      else
         Canvas.FillRectangle(x + i*bw, y + (h/2), x + (i+1)*bw - 1, y + (h/2) + barH, col);
   }
   Canvas.Line(x, y+(h/2), x+w, y+(h/2), ARGB_Helper(clrGray, 50));
}

//--- Tab: Calendar
void DrawTabCalendar()
{
   string days[] = {"S","M","T","W","T","F","S"};
   int startX = 25, startY = 150, cell = 47;
   
   Canvas.FontSet("Outfit", 12, FW_BOLD);
   Canvas.TextOut(25, 115, "MONTHLY PERFORMANCE", ARGB_Helper(clrWhite));
   
   for(int i=0; i<7; i++) {
      Canvas.FontSet("Outfit", 10, FW_BOLD);
      Canvas.TextOut(startX + i*cell + 18, startY-24, days[i], ARGB_Helper(clrSlateGray));
   }
   
   // Simplified 5x7 grid for current month
   int dayCounter = 1;
   for(int r=0; r<5; r++) {
      for(int c=0; c<7; c++) {
         if(dayCounter <= 31) {
            double pnl = DailyPnL[dayCounter];
            uint cellCol = (pnl == 0) ? ARGB_Helper(C'33, 38, 45', 80) : (pnl > 0 ? ARGB_Helper(InpMainColor, 60) : ARGB_Helper(clrRed, 60));
            uint borderCol = (pnl == 0) ? ARGB_Helper(clrGray, 30) : (pnl > 0 ? ARGB_Helper(InpMainColor, 120) : ARGB_Helper(clrRed, 120));
            
            DrawRoundedRect(startX + c*cell, startY + r*cell, startX + (c+1)*cell - 3, startY + (r+1)*cell - 3, 5, cellCol);
            DrawRoundedRect(startX + c*cell, startY + r*cell, startX + (c+1)*cell - 3, startY + (r+1)*cell - 3, 5, borderCol, false);
            
            Canvas.FontSet("Outfit", 9, FW_NORMAL);
            Canvas.TextOut(startX + c*cell + 6, startY + r*cell + 6, (string)dayCounter, ARGB_Helper(clrWhite, 150));
            
            if(pnl != 0) {
               Canvas.FontSet("Outfit", 9, FW_BOLD);
               string p = (pnl > 0 ? "+" : "") + DoubleToString(pnl, 0);
               Canvas.TextOut(startX + c*cell + 6, startY + r*cell + 24, p, ARGB_Helper(clrWhite));
            }
            dayCounter++;
         }
      }
   }
}

//--- Tab: History
void DrawTabHistory()
{
   int y = 125;
   Canvas.FontSet("Outfit", 12, FW_BOLD);
   Canvas.TextOut(20, y, "RECENT TRANSACTIONS", ARGB_Helper(clrWhite));
   
   int count = ArraySize(HistoryData);
   int limit = (count > 15) ? 15 : count;
   
   for(int i=0; i<limit; i++)
   {
      TradeRecord rec = HistoryData[count - 1 - i];
      int rowY = y + 35 + (i*30);
      
      DrawGlassPanel(20, rowY, 340, 26, 6);
      
      Canvas.FontSet("Outfit", 10, FW_NORMAL);
      Canvas.TextOut(35, rowY + 6, rec.symbol, ARGB_Helper(clrWhite));
      Canvas.FontSet("Outfit", 8, FW_NORMAL);
      Canvas.TextOut(110, rowY + 8, "(" + DoubleToString(rec.volume, 2) + " Lots)", ARGB_Helper(clrSlateGray));
      
      uint pnlCol = rec.pnl >= 0 ? ARGB_Helper(InpMainColor) : ARGB_Helper(clrRed);
      Canvas.FontSet("Outfit", 11, FW_BOLD);
      string pnlStr = (rec.pnl >= 0 ? "+" : "") + DoubleToString(rec.pnl, 2);
      Canvas.TextOut(275, rowY + 6, pnlStr, pnlCol);
   }
}

//--- Tab: Risk Calculator
void DrawTabCalc()
{
   int y = 125;
   Canvas.FontSet("Outfit", 12, FW_BOLD);
   Canvas.TextOut(20, y, "RISK MANAGEMENT", ARGB_Helper(clrWhite));
   
   // Layout
   DrawGlassPanel(20, y+30, 340, 170, 15);
   Canvas.FontSet("Outfit", 9, FW_NORMAL);
   Canvas.TextOut(40, y+48, "AVAILABLE EQUITY: " + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2), ARGB_Helper(clrSlateGray));
   
   // Input Simulators
   DrawInputBox(40, y+75, 300, 44, "RISK PER TRADE (%)", DoubleToString(CalcRiskPct, 1) + "%");
   DrawInputBox(40, y+135, 300, 44, "STOP LOSS (PIPS)", DoubleToString(CalcSL, 1));
   
   // Result Box
   DrawGradientRect(20, y+220, 360, y+370, ARGB_Helper(InpMainColor, 60), ARGB_Helper(C'13, 17, 23', 80), true);
   DrawRoundedRect(20, y+220, 360, y+370, 15, ARGB_Helper(InpMainColor, 180), false);
   
   Canvas.FontSet("Outfit", 11, FW_BOLD);
   Canvas.TextOut(115, y+238, "OPTIMAL POSITION SIZE", ARGB_Helper(clrWhite));
   
   Canvas.FontSet("Outfit", 48, FW_BOLD);
   string lotStr = DoubleToString(CalcResultLot, 2);
   Canvas.TextOut(140, y+265, lotStr, ARGB_Helper(clrWhite));
   
   Canvas.FontSet("Outfit", 9, FW_NORMAL);
   Canvas.TextOut(90, y+344, "TARGET SL LEVEL: CLICK ON CHART", ARGB_Helper(InpMainColor));
}

void DrawInputBox(int x, int y, int w, int h, string label, string val)
{
   DrawRoundedRect(x, y, x+w, y+h, 8, ARGB_Helper(C'48, 54, 61', 100), true);
   DrawRoundedRect(x, y, x+w, y+h, 8, ARGB_Helper(C'48, 54, 61', 200), false);
   
   Canvas.FontSet("Outfit", 8, FW_NORMAL);
   Canvas.TextOut(x+5, y-14, label, ARGB_Helper(clrSlateGray));
   Canvas.FontSet("Outfit", 12, FW_BOLD);
   Canvas.TextOut(x+15, y+13, val, ARGB_Helper(clrWhite));
   
   // Minus Button (26x26)
   int btnMinusX1 = x + w - 62;
   int btnMinusY1 = y + 9;
   DrawRoundedRect(btnMinusX1, btnMinusY1, btnMinusX1 + 26, btnMinusY1 + 26, 4, ARGB_Helper(C'48, 54, 61', 200), true);
   Canvas.FontSet("Outfit", 11, FW_BOLD);
   Canvas.TextOut(btnMinusX1 + 9, btnMinusY1 + 5, "-", ARGB_Helper(clrWhite));
   
   // Plus Button (26x26)
   int btnPlusX1 = x + w - 32;
   int btnPlusY1 = y + 9;
   DrawRoundedRect(btnPlusX1, btnPlusY1, btnPlusX1 + 26, btnPlusY1 + 26, 4, ARGB_Helper(InpMainColor, 200), true);
   Canvas.FontSet("Outfit", 11, FW_BOLD);
   Canvas.TextOut(btnPlusX1 + 7, btnPlusY1 + 5, "+", ARGB_Helper(clrWhite));
}

//--- Tab: Ecosystem
void DrawTabEcosystem()
{
   int y = 125;
   Canvas.FontSet("Outfit", 12, FW_BOLD);
   Canvas.TextOut(20, y, "JTG ECOSYSTEM", ARGB_Helper(clrWhite));
   
   DrawGlassPanel(20, y+35, 340, 130, 15);
   Canvas.FontSet("Outfit", 11, FW_BOLD);
   Canvas.TextOut(40, y+52, "SYSTEM CONNECTED", ARGB_Helper(InpMainColor));
   
   Canvas.FontSet("Outfit", 10, FW_NORMAL);
   Canvas.TextOut(40, y+80, "Evolution Build: v1.10", ARGB_Helper(clrWhite, 150));
   Canvas.TextOut(40, y+102, "Sync Status: " + SyncStatus, ARGB_Helper(clrSlateGray));
   Canvas.TextOut(40, y+124, "Last Sync: " + LastSyncTime, ARGB_Helper(clrSlateGray));
   
   // Open Web Dash Button
   DrawRoundedRect(40, y+190, 340, y+240, 10, ARGB_Helper(InpMainColor), true);
   Canvas.FontSet("Outfit", 12, FW_BOLD);
   Canvas.TextOut(125, y+205, "OPEN WEB DASH", ARGB_Helper(clrWhite));
   
   // Sync Now Button
   DrawRoundedRect(40, y+255, 340, y+305, 10, ARGB_Helper(C'22, 44, 153', 200), true);
   DrawRoundedRect(40, y+255, 340, y+305, 10, ARGB_Helper(InpMainColor, 150), false);
   Canvas.FontSet("Outfit", 12, FW_BOLD);
   Canvas.TextOut(145, y+270, "SYNC NOW", ARGB_Helper(clrWhite));
}

// Footer
void DrawFooter()
{
   Canvas.FontSet("Outfit", 6, FW_NORMAL);
   Canvas.TextOut(100, PANEL_H - 30, "© 2026 JTG ECOSYSTEM LTD", ARGB_Helper(clrGray, 100));
}
//+------------------------------------------------------------------+
//| Dynamic Risk Lot Calculator                                      |
//+------------------------------------------------------------------+
void RecalculateLot()
{
   double balanced = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskVal = balanced * (CalcRiskPct/100.0);
   double tickVal = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   
   if(CalcSL > 0 && tickSize > 0)
   {
      // Universal lot calculation formula
      CalcResultLot = riskVal / (CalcSL * 10.0 * (tickVal / tickSize * _Point));
      
      // Normalize to broker limits
      double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
      double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
      double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
      
      if(CalcResultLot < minLot) CalcResultLot = minLot;
      if(CalcResultLot > maxLot) CalcResultLot = maxLot;
      
      // Round to nearest step
      CalcResultLot = MathRound(CalcResultLot / stepLot) * stepLot;
   }
   else
   {
      CalcResultLot = 0;
   }
}

//+------------------------------------------------------------------+
//| Cloud Sync Integration                                           |
//+------------------------------------------------------------------+
void PushTradesToCloud()
{
   SyncStatus = "Syncing...";
   DrawUI();
   
   if(InpTerminalKey == "JTG-XXXX-XXXX" || InpTerminalKey == "")
   {
      SyncStatus = "Error: Key Missing";
      DrawUI();
      Print("JTG Error: Sync Key is missing. Please generate a Sync Key on the web dashboard and paste it into InpTerminalKey.");
      return;
   }
   
   // 1. Get account metadata
   long accountLogin = AccountInfoInteger(ACCOUNT_LOGIN);
   string accountBroker = AccountInfoString(ACCOUNT_COMPANY);
   double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   
   string brokerEscaped = accountBroker;
   StringReplace(brokerEscaped, "\"", "\\\"");
   
   // 2. Serialize trades and balance transactions to rich JSON
   string json = "{";
   
   // Metadata
   json += "\"metadata\":{";
   json += "\"login\":" + IntegerToString(accountLogin) + ",";
   json += "\"broker\":\"" + brokerEscaped + "\",";
   json += "\"balance\":" + DoubleToString(accountBalance, 2) + ",";
   json += "\"currency\":\"" + AccountCurrency + "\"";
   json += "},";
   
   // Trades
   json += "\"trades\":[";
   int size = ArraySize(HistoryData);
   for(int i = 0; i < size; i++)
   {
      if(i > 0) json += ",";
      json += "{";
      json += "\"ticket\":" + IntegerToString(HistoryData[i].ticket) + ",";
      json += "\"symbol\":\"" + HistoryData[i].symbol + "\",";
      json += "\"volume\":" + DoubleToString(HistoryData[i].volume, 2) + ",";
      json += "\"pnl\":" + DoubleToString(HistoryData[i].pnl, 2) + ",";
      json += "\"closeTime\":" + IntegerToString((long)HistoryData[i].closeTime) + ",";
      json += "\"type\":" + IntegerToString(HistoryData[i].type);
      json += "}";
   }
   json += "],";
   
   // Balance Transactions
   json += "\"balance_transactions\":[";
   int balSize = ArraySize(BalanceData);
   for(int i = 0; i < balSize; i++)
   {
      if(i > 0) json += ",";
      json += "{";
      json += "\"ticket\":" + IntegerToString(BalanceData[i].ticket) + ",";
      json += "\"amount\":" + DoubleToString(BalanceData[i].amount, 2) + ",";
      json += "\"time\":" + IntegerToString((long)BalanceData[i].time);
      json += "}";
   }
   json += "]";
   
   json += "}";
   
   // 2. Prep headers & POST data
   string headers = "Content-Type: application/json\r\n" +
                    "X-Sync-Key: " + InpTerminalKey + "\r\n";
   uchar post_data[];
   int len = StringToCharArray(json, post_data, 0, WHOLE_ARRAY, CP_UTF8);
   if(len > 1) ArrayResize(post_data, len - 1); // remove null terminator
   
   uchar result[];
   string result_headers;
   
   // 3. Make WebRequest
   ResetLastError();
   int res = WebRequest("POST", InpSyncUrl, headers, 5000, post_data, result, result_headers);
   
   if(res >= 200 && res < 300)
   {
      SyncStatus = "Success";
      LastSyncTime = TimeToString(TimeCurrent(), TIME_DATE|TIME_MINUTES);
      Print("JTG Success: " + IntegerToString(size) + " trades synced to dashboard successfully.");
      SendNotification("JTG Journal: Successfully synced " + IntegerToString(size) + " trades to your web dashboard!");
   }
   else
   {
      SyncStatus = "Failed (" + IntegerToString(res) + ")";
      Print("JTG Error: Cloud Sync failed with response code: " + IntegerToString(res) + ". Error Code: " + IntegerToString(GetLastError()));
      if(res == -1)
      {
         Print("JTG Hint: Please check if InpSyncUrl is whitelisted in MT5 -> Tools -> Options -> Expert Advisors -> Allow WebRequest for listed URL.");
      }
   }
   
   DrawUI();
}

//+------------------------------------------------------------------+
//| ChartEvent Mapping                                               |
//+------------------------------------------------------------------+
void OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam)
{
   // 1. Update global coordinates on mouse move
   if(id == CHARTEVENT_MOUSE_MOVE)
   {
      GlobalMouseX = (int)lparam;
      GlobalMouseY = (int)dparam;
      
      if(IsDragging)
      {
         int state = (int)StringToInteger(sparam);
         bool leftButtonPressed = ((state & 1) != 0);
         
         if(!leftButtonPressed)
         {
            IsDragging = false;
         }
         else
         {
            FloatingX = GlobalMouseX - DragOffsetX;
            FloatingY = GlobalMouseY - DragOffsetY;
            
            // Constrain within chart bounds
            int chartW = (int)ChartGetInteger(0, CHART_WIDTH_IN_PIXELS);
            int chartH = (int)ChartGetInteger(0, CHART_HEIGHT_IN_PIXELS);
            int activeW = IsMinimized ? 160 : PANEL_W;
            int activeH = IsMinimized ? 45 : PANEL_H;
            
            if(FloatingX < 0) FloatingX = 0;
            if(FloatingX > chartW - activeW) FloatingX = chartW - activeW;
            if(FloatingY < 0) FloatingY = 0;
            if(FloatingY > chartH - activeH) FloatingY = chartH - activeH;
            
            IsDocked = false; // Dragging automatically undocks!
            UpdateDashboardSize();
         }
      }
      return; // No click handling for pure movement
   }
   
   // 2. Handle both background chart clicks and foreground object clicks
   if(id == CHARTEVENT_CLICK || (id == CHARTEVENT_OBJECT_CLICK && sparam == "JTG_Advanced_Dashboard"))
   {
      // Use the recorded mouse coordinates at the instant of the click
      int x = GlobalMouseX;
      int y = GlobalMouseY;
      
      int chartW = (int)ChartGetInteger(0, CHART_WIDTH_IN_PIXELS);
      int chartH = (int)ChartGetInteger(0, CHART_HEIGHT_IN_PIXELS);
      
      int activeW = IsMinimized ? 160 : PANEL_W;
      int activeH = IsMinimized ? 45 : PANEL_H;
      
      int relativeX = 0;
      int relativeY = 0;
      
      if(!IsDocked)
      {
         relativeX = x - FloatingX;
         relativeY = y - FloatingY;
      }
      else
      {
         if(InpCorner == CORNER_LEFT_UPPER)
         {
            relativeX = x - 10;
            relativeY = y - 30;
         }
         else if(InpCorner == CORNER_RIGHT_UPPER)
         {
            relativeX = x - (chartW - activeW - 10);
            relativeY = y - 30;
         }
         else if(InpCorner == CORNER_LEFT_LOWER)
         {
            relativeX = x - 10;
            relativeY = y - (chartH - activeH - 30);
         }
         else if(InpCorner == CORNER_RIGHT_LOWER)
         {
            relativeX = x - (chartW - activeW - 10);
            relativeY = y - (chartH - activeH - 30);
         }
      }

      // Check minimized actions
      if(IsMinimized)
      {
         // Clicked inside the minimized bounds?
         if(relativeX >= 0 && relativeX <= 160 && relativeY >= 0 && relativeY <= 45)
         {
            // Restore button click?
            if(relativeX >= 125 && relativeX <= 149 && relativeY >= 10 && relativeY <= 34)
            {
               IsMinimized = false;
               UpdateDashboardSize();
               DrawUI();
               return;
            }
            else
            {
               // Start dragging minimized capsule
               IsDragging = true;
               if(IsDocked)
               {
                  if(InpCorner == CORNER_LEFT_UPPER) { FloatingX = 10; FloatingY = 30; }
                  else if(InpCorner == CORNER_RIGHT_UPPER) { FloatingX = chartW - activeW - 10; FloatingY = 30; }
                  else if(InpCorner == CORNER_LEFT_LOWER) { FloatingX = 10; FloatingY = chartH - activeH - 30; }
                  else if(InpCorner == CORNER_RIGHT_LOWER) { FloatingX = chartW - activeW - 10; FloatingY = chartH - activeH - 30; }
               }
               DragOffsetX = x - FloatingX;
               DragOffsetY = y - FloatingY;
               return;
            }
         }
      }
      else
      {
         // Normal state click in header? (Height 70px)
         if(relativeX >= 0 && relativeX <= PANEL_W && relativeY >= 0 && relativeY <= 70)
         {
            // Minimize button [-] click? (x from 310 to 334, y from 23 to 47)
            if(relativeX >= 310 && relativeX <= 334 && relativeY >= 23 && relativeY <= 47)
            {
               IsMinimized = true;
               UpdateDashboardSize();
               DrawUI();
               return;
            }
            // Dock/Pin button click? (x from 342 to 366, y from 23 to 47)
            else if(relativeX >= 342 && relativeX <= 366 && relativeY >= 23 && relativeY <= 47)
            {
               IsDocked = !IsDocked;
               UpdateDashboardSize();
               DrawUI();
               return;
            }
            else
            {
               // Start dragging full panel
               IsDragging = true;
               if(IsDocked)
               {
                  if(InpCorner == CORNER_LEFT_UPPER) { FloatingX = 10; FloatingY = 30; }
                  else if(InpCorner == CORNER_RIGHT_UPPER) { FloatingX = chartW - activeW - 10; FloatingY = 30; }
                  else if(InpCorner == CORNER_LEFT_LOWER) { FloatingX = 10; FloatingY = chartH - activeH - 30; }
                  else if(InpCorner == CORNER_RIGHT_LOWER) { FloatingX = chartW - activeW - 10; FloatingY = chartH - activeH - 30; }
               }
               DragOffsetX = x - FloatingX;
               DragOffsetY = y - FloatingY;
               return;
            }
         }
      }

      // Updated Hitbox for Tabs (Matches the new UI layout: y from 75 to 115)
      if(relativeY > 75 && relativeY < 115) {
         int tw = (PANEL_W - 40) / 6;
         int tx = relativeX - 20; // Subtract start padding
         if(tx >= 0 && tx < (PANEL_W - 40))
         {
            int tabIndex = tx / tw;
            if(tabIndex >= 0 && tabIndex <= 5)
            {
               CurrentTab = (ENUM_TAB)tabIndex;
               DrawUI();
            }
         }
      }
      
      // Calculator tab button clicks (minus/plus adjustments with new 26x26px bounds)
      if(CurrentTab == TAB_CALC)
      {
         // Risk Minus: x from 278 to 304, y from 209 to 235
         if(relativeX >= 278 && relativeX <= 304 && relativeY >= 209 && relativeY <= 235)
         {
            CalcRiskPct = MathMax(0.1, CalcRiskPct - 0.5);
            RecalculateLot();
            DrawUI();
         }
         // Risk Plus: x from 308 to 334, y from 209 to 235
         if(relativeX >= 308 && relativeX <= 334 && relativeY >= 209 && relativeY <= 235)
         {
            CalcRiskPct = MathMin(10.0, CalcRiskPct + 0.5);
            RecalculateLot();
            DrawUI();
         }
         // SL Minus: x from 278 to 304, y from 269 to 295
         if(relativeX >= 278 && relativeX <= 304 && relativeY >= 269 && relativeY <= 295)
         {
            CalcSL = MathMax(1.0, CalcSL - 5.0);
            RecalculateLot();
            DrawUI();
         }
         // SL Plus: x from 308 to 334, y from 269 to 295
         if(relativeX >= 308 && relativeX <= 334 && relativeY >= 269 && relativeY <= 295)
         {
            CalcSL = MathMin(200.0, CalcSL + 5.0);
            RecalculateLot();
            DrawUI();
         }
      }
      
      // Ecosystem tab button clicks
      if(CurrentTab == TAB_ECOSYSTEM)
      {
         // Open Web Dash Button: x from 40 to 340, y from 315 to 365
         if(relativeX >= 40 && relativeX <= 340 && relativeY >= 315 && relativeY <= 365)
         {
            Print("JTG Ecosystem: Please open your browser and navigate to your dashboard at: https://jtgjournal.johnadtradersgroup.name.ng/");
         }
         // Sync Now Button: x from 40 to 340, y from 380 to 430
         if(relativeX >= 40 && relativeX <= 340 && relativeY >= 380 && relativeY <= 430)
         {
            PushTradesToCloud();
         }
      }
      
      // Calculator Interaction: Click chart to set SL if on CALC tab
      if(CurrentTab == TAB_CALC && (relativeX < 0 || relativeX > activeW || relativeY < 0 || relativeY > activeH)) // Clicked outside panel (on chart)
      {
         double price; datetime time; int sub;
         ChartXYToTimePrice(0, (int)lparam, (int)dparam, sub, time, price);
         CalcSL = MathAbs(SymbolInfoDouble(_Symbol, SYMBOL_BID) - price) / _Point / 10.0; // Pips
         
         // Auto-calculate lot
         RecalculateLot();
         
         DrawUI();
         
         // Visual Line
         ObjectDelete(0, "JTG_SL_PLAN");
         ObjectCreate(0, "JTG_SL_PLAN", OBJ_HLINE, 0, 0, price);
         ObjectSetInteger(0, "JTG_SL_PLAN", OBJPROP_COLOR, clrRed);
         ObjectSetInteger(0, "JTG_SL_PLAN", OBJPROP_STYLE, STYLE_DOT);
      }
   }
}
//+------------------------------------------------------------------+
