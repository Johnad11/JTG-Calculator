import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const tour = driver({
    showProgress: true,
    animate: true,
    overlayColor: "rgba(0, 0, 0, 0.8)",
    stagePadding: 10,
    popoverClass: "jtg-tour-popover",
    steps: [
        {
            element: "#nav-calc",
            popover: {
                title: "Position Calculator",
                description: "Calculate your lot size and risk-reward ratio instantly before every trade.",
                side: "right",
                align: "start"
            }
        },
        {
            element: "#nav-journal",
            popover: {
                title: "Trade Entry",
                description: "Log your trades with precision to keep track of your performance.",
                side: "right",
                align: "start"
            }
        },
        {
            element: "#nav-trades",
            popover: {
                title: "Trade Logs",
                description: "View all your past trades, filter by account, and analyze your history.",
                side: "right",
                align: "start"
            }
        },
        {
            element: "#nav-calendar",
            popover: {
                title: "Trading Calendar",
                description: "See your daily P&L and trading consistency at a glance.",
                side: "right",
                align: "start"
            }
        },
        {
            element: "#nav-perf",
            popover: {
                title: "Performance Analytics",
                description: "Deep dive into your stats, equity curves, and overall profitability.",
                side: "right",
                align: "start"
            }
        },
        {
            element: "#account-switcher-button",
            popover: {
                title: "Multi-Account Manager",
                description: "Switch between your Personal, Prop Firm, and Synthetic accounts seamlessly.",
                side: "bottom",
                align: "start"
            }
        },
        {
            element: "#tour-button",
            popover: {
                title: "Ready to Explore?",
                description: "You can replay this tour anytime by clicking the TOUR button here. Good luck, trader!",
                side: "top",
                align: "center"
            }
        }
    ]
});

export const startAppTour = () => {
    // Add custom styling via standard CSS injection if needed
    if (!document.getElementById('jtg-tour-styles')) {
        const style = document.createElement('style');
        style.id = 'jtg-tour-styles';
        style.innerHTML = `
            .jtg-tour-popover {
                background: #0a0e1a !important;
                border: 2px border-jtg-blue/30 !important;
                border-radius: 16px !important;
                padding: 20px !important;
                color: white !important;
                box-shadow: 0 0 30px rgba(0, 255, 127, 0.1) !important;
                animation: pop 0.3s ease-out;
            }
            .jtg-tour-popover .driver-popover-title {
                color: #1ba657 !important;
                font-weight: 900 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.1em !important;
                font-size: 16px !important;
                margin-bottom: 8px !important;
            }
            .jtg-tour-popover .driver-popover-description {
                color: #94a3b8 !important;
                font-size: 13px !important;
                line-height: 1.6 !important;
            }
            .jtg-tour-popover .driver-popover-progress-text {
                color: #64748b !important;
                font-size: 10px !important;
                font-weight: bold !important;
            }
            .jtg-tour-popover .driver-popover-navigation-btns button {
                background: #1ba657 !important;
                color: black !important;
                text-shadow: none !important;
                font-weight: 800 !important;
                font-size: 11px !important;
                text-transform: uppercase !important;
                border-radius: 8px !important;
                padding: 6px 12px !important;
                border: none !important;
                transition: transform 0.2s !important;
            }
            .jtg-tour-popover .driver-popover-navigation-btns button:hover {
                transform: scale(1.05) !important;
            }
            .jtg-tour-popover .driver-popover-navigation-btns .driver-popover-prev-btn {
                background: #1e293b !important;
                color: #94a3b8 !important;
            }
            .jtg-tour-popover .driver-popover-arrow {
                border-color: #0a0e1a !important;
            }
        `;
        document.head.appendChild(style);
    }

    tour.drive();
};
