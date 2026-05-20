========================================================================
                      JTG EVOLUTION MT5 AUTO-SYNC EA
========================================================================
Product Version: 1.10
Copyright: 2026, JTG Ecosystem
Official Website: https://jtg-ecosystem.app/
Web Journal: https://jtg-journals.vercel.app/

Thank you for upgrading to the JTG Premium Package! The JTG Evolution 
Expert Advisor (EA) is a premium, state-of-the-art on-chart visual companion 
and real-time auto-sync journaling utility designed exclusively for 
MetaTrader 5 (MT5). 

------------------------------------------------------------------------
[CRITICAL WARNING: BROKER & PROP FIRM POLICIES]
------------------------------------------------------------------------
* WARNING: Do NOT use this EA with brokers that explicitly prohibit 
  automated trading, Expert Advisors, or high-frequency automated tools. 
  It is your absolute responsibility to read and check your broker's 
  Terms of Service prior to deploying this EA.
* PROPRIETARY TRADING FIRMS (PROP FIRMS): Some prop firms restrict 
  the use of EAs or flag external WebRequests (network calls) as a 
  violation of challenge guidelines. Ensure your prop firm allows EAs 
  and whitelists WebRequests to external APIs before activating sync on 
  evaluation or funded challenge accounts.
* SECURITY: Keep your Sync Key private. Anyone who gains access to your 
  Sync Key can push unauthorized trade history into your JTG Journal.

------------------------------------------------------------------------
[ON-CHART FUNCTIONS & FEATURES]
------------------------------------------------------------------------
1. PREMIUM NEON-GLOW VECTOR HUD (100% CCanvas Rendering)
   The entire dashboard renders directly in the foreground of your MT5 
   chart using vector coordinates. It overlays on top of the bars/candles, 
   providing a high-tech electric-green HUD dashboard.

2. MINIMIZABLE & DOCKABLE WINDOW
   * Minimized Capsule UI: Double-click the '-' button to shrink the entire 
     dashboard into a sleek, glowing miniature capsule pill, saving valuable 
     chart real estate. Click the [+] to restore it.
   * Dock Status Toggle: Click the 'P' (Pinned) / 'F' (Floating) button to 
     undock the panel. When undocked (F), click and drag the panel anywhere 
     on your screen.

3. SIX HIGH-VALUE TAB SPACES
   * DASH Tab (Overview): Displays real-time Net Profit, Win Rate (%), Total 
     Trades count, and a beautiful Area Chart detailing your Equity Evolution.
   * STAT Tab (Analytics): Advanced mathematical stats including Expectancy, 
     Sharpe Ratio, Profit Factor, and Account Growth. Includes hourly trade 
     distribution heatmaps and dedicated Asian/London/New York session PnL metrics.
   * CAL Tab (Performance Calendar): An on-chart 31-day visual calendar that 
     color-codes each day (Green for win, Red for loss, Gray for no trades) 
     with specific daily PnL summaries.
   * LOGS Tab (Recent Trades): Quick-scroll log displaying your last 15 
     completed orders with symbol, ticket ID, lot size, and direct profit.
   * RISK Tab (Position Sizer): Interactive lot calculator. Automatically 
     calculates optimal position sizing based on your current balance, customizable 
     risk percentage, and stop loss. Allows clicking directly on the live chart 
     to dynamically calculate Stop Loss pips!
   * JTG Tab (Ecosystem Connectivity): Network controller that shows live 
     WebRequest status, last sync timestamp, and features a "SYNC NOW" manual sync button.

------------------------------------------------------------------------
[STEP-BY-STEP APP LINKING INSTRUCTIONS]
------------------------------------------------------------------------
Follow these steps to link your MT5 terminal history with the JTG web app:

STEP 1: GENERATE YOUR SYNC KEY
* Log into the JTG Journal Web App.
* Click the "MT5 Auto-Sync" button on the sidebar.
* Click the "Generate Sync Key" button to generate a unique private key (e.g., JTG-XXXX-XXXX). Copy this key.

STEP 2: ENABLE WEBREQUESTS IN MT5
* Open your MetaTrader 5 terminal on your PC.
* In the top menu, go to: Tools -> Options.
* Select the "Expert Advisors" tab.
* Check the box: "Allow WebRequest for listed URL:".
* Double-click the "+" symbol and add this exact URL:
  https://jtg-journals.vercel.app
* Click OK to save the changes.

STEP 3: DEPLOY THE EA ON A CHART
* Open the Navigator panel in MT5 (Ctrl + N).
* Expand the "Expert Advisors" folder.
* Drag and drop the "JTG_Journal_EA" onto any active chart.
* In the EA properties window, select the "Inputs" tab.
* Locate the "InpTerminalKey" parameter and double-click the value.
* Paste your copied "Sync Key" (JTG-XXXX-XXXX) here.
* (Optional) Adjust InpRefreshSec to change how often it syncs (default is 5s).
* Click OK.

STEP 4: VERIFY CONNECTIVITY
* Look at the "JTG" Tab inside the on-chart dashboard.
* If successful, the Sync Status will read "Success" and show the current timestamp.
* If it reads "Failed (-1)" or "Failed (401/403)", check that:
  - Your Sync Key is entered correctly and your subscription is active.
  - You whitelisted the URL in MT5 Tools -> Options.
  - Your computer has an active internet connection.

------------------------------------------------------------------------
[SUPPORT AND ENQUIRIES]
------------------------------------------------------------------------
Have questions, suggestions, or experiencing issues setting up your MT5 EA?
* DISCORD SERVER: Join our JTG Ecosystem Discord Channel for community 
  support, updates, and direct developer communication:
  https://discord.gg/ZZaTHrq3a

* WHATSAPP CLIENT CARE: Connect directly with our customer success team for 
  prompt resolution of your enquiries:
  https://chat.whatsapp.com/Dasf32dLxyQHny6eUADTHg
========================================================================
