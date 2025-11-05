import { useEffect } from 'react';
import '../Css/DashboardPage.css';

function DashboardPage() {

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    return (
        <div className='dashboard-container'>
            <div className='sidebar'>
                <div className='logo-section'>
                    <div className='logo'>NB</div>
                    <div className='brand'>
                        <span>Financial</span>
                        <span>Dashboard</span>
                    </div>
                </div>
                <nav className='nav-menu'>
                    <div className='nav-item active'>Dashboard</div>
                    <div className='nav-item'>Transactions</div>
                    <div className='nav-item'>Analytics</div>
                    <div className='nav-item'>Settings</div>
                </nav>
            </div>

            <div className='main-content'>
                <header className='dashboard-header'>
                    <div className='header-left'>
                        <h1>Financial Dashboard</h1>
                        <div className='date-info'>
                            <span className='day'>19</span>
                            <div className='date-text'>
                                <span>Tue,</span>
                                <span>December</span>
                            </div>
                        </div>
                    </div>
                    <div className='header-right'>
                        <div className='search-box'>
                            <input type="text" placeholder="Start searching here..." />
                        </div>
                        <div className='user-profile'>
                            <div className='user-avatar'></div>
                            <div className='user-info'>
                                <span>Dwayne Tatum</span>
                                <span>CEO Assistant</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className='logout-btn'>Logout</button>
                    </div>
                </header>

                <div className='dashboard-grid'>
                    <div className='card account-card'>
                        <div className='card-header'>
                            <span>VISA</span>
                            <span>Direct Debits</span>
                        </div>
                        <div className='account-number'>**** 2719</div>
                        <div className='card-actions'>
                            <button className='btn-primary'>Receive</button>
                            <button className='btn-secondary'>Send</button>
                        </div>
                        <div className='monthly-fee'>
                            <span>Monthly regular fee</span>
                            <span>$ 25.00</span>
                        </div>
                    </div>

                    <div className='card income-card'>
                        <div className='metric'>
                            <span>Your income</span>
                            <span className='amount'>$ 23,194.80</span>
                        </div>
                        <div className='metric'>
                            <span>Total paid</span>
                            <span className='amount'>$ 8,145.20</span>
                        </div>
                    </div>

                    <div className='card help-card'>
                        <h3>Hey, Need help?</h3>
                        <p>Just ask me anything!</p>
                        <div className='help-actions'>
                            <span>Weekly</span>
                            <div className='system-lock'>
                                <span>System Lock</span>
                                <div className='days-info'>
                                    <span>13 Days</span>
                                    <span>109 hours, 23 minutes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='card progress-card'>
                        <div className='circular-progress'>
                            <div className='progress-circle'>
                                <span>38%</span>
                                <span>Annual limit</span>
                            </div>
                        </div>
                        <div className='progress-amount'>$ 16,073.49</div>
                    </div>

                    <div className='card profits-card'>
                        <h3>Annual profits</h3>
                        <div className='profit-chart'>
                            <div className='chart-circle large'>
                                <span>$ 14K</span>
                                <div className='inner-circle medium'>
                                    <span>$ 9.3K</span>
                                    <div className='inner-circle small'>
                                        <span>$ 6.8K</span>
                                        <div className='center-circle'>
                                            <span>$ 4K</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='card activity-card'>
                        <div className='activity-header'>
                            <h3>Activity manager</h3>
                            <div className='activity-tabs'>
                                <span>Team</span>
                                <span>Insights</span>
                                <span>Today</span>
                            </div>
                        </div>
                        <div className='activity-chart'>
                            <div className='chart-value'>$ 43.20</div>
                            <div className='chart-bars'>
                                <div className='bar'></div>
                                <div className='bar'></div>
                                <div className='bar active'></div>
                                <div className='bar'></div>
                                <div className='bar'></div>
                            </div>
                        </div>
                        <div className='activity-items'>
                            <div className='activity-item'>Business plans</div>
                            <div className='activity-item'>Bank loans</div>
                            <div className='activity-item'>Accounting</div>
                            <div className='activity-item'>HR management</div>
                        </div>
                    </div>

                    <div className='card stocks-card'>
                        <h3>Main Stocks</h3>
                        <span>Extended Limited</span>
                        <div className='stock-chart'>
                            <div className='chart-line'></div>
                        </div>
                        <div className='stock-change'>+ 9.3%</div>
                    </div>

                    <div className='card verification-card'>
                        <h3>Wallet Verification</h3>
                        <p>We need 2-step verification to secure your account</p>
                        <button className='btn-primary'>Enable</button>
                    </div>

                    <div className='card business-card'>
                        <h3>How is your business management going?</h3>
                        <div className='rating-stars'>
                            <div className='star'></div>
                            <div className='star'></div>
                            <div className='star'></div>
                            <div className='star'></div>
                            <div className='star'></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;