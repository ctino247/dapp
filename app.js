document.addEventListener('DOMContentLoaded', () => {
    const rootDiv = document.getElementById('root');
    let tronWeb = null;
    let userAddress = null;

    // --- UI Creation ---
    const connectButton = document.createElement('button');
    connectButton.textContent = 'Connect Wallet';
    connectButton.style.position = 'absolute';
    connectButton.style.top = '20px';
    connectButton.style.right = '20px';
    connectButton.style.padding = '10px 20px';
    connectButton.style.border = 'none';
    connectButton.style.borderRadius = '5px';
    connectButton.style.backgroundColor = '#3B82F6';
    connectButton.style.color = 'white';
    connectButton.style.cursor = 'pointer';
    document.body.appendChild(connectButton);

    const statusDiv = document.createElement('div');
    statusDiv.style.position = 'absolute';
    statusDiv.style.top = '70px';
    statusDiv.style.right = '20px';
    statusDiv.style.color = '#1F2937';
    document.body.appendChild(statusDiv);

    // --- Wallet Connection Logic ---
    const connectWallet = async () => {
        if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
            tronWeb = window.tronWeb;
            userAddress = tronWeb.defaultAddress.base58;
            console.log("TronLink connected!");
            console.log("User Address:", userAddress);

            connectButton.textContent = `Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
            statusDiv.textContent = 'Fetching data...';

            await registerOrLoginUser(userAddress);
            await fetchStats();

        } else {
            statusDiv.textContent = 'TronLink not found or not logged in.';
            console.error("TronLink is not connected.");
        }
    };

    connectButton.addEventListener('click', connectWallet);

    // --- API Communication ---
    const registerOrLoginUser = async (walletAddress) => {
        try {
            const response = await fetch('/api/index.php/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ wallet_address: walletAddress }),
            });
            const data = await response.json();
            console.log('User login/register response:', data);
            statusDiv.textContent = data.message || `Welcome ${walletAddress.substring(0, 6)}...`;
        } catch (error) {
            console.error('Error registering/logging in user:', error);
            statusDiv.textContent = 'Error communicating with server.';
        }
    };

    const fetchStats = async () => {
         try {
            // Pass userAddress to get user-specific stats
            const response = await fetch(`/api/index.php/stats?wallet_address=${userAddress}`);
            const data = await response.json();
            console.log('Stats response:', data);

            if (response.ok) {
                document.getElementById('total-users').textContent = data.total_users || '0';
                document.getElementById('total-volume').textContent = `$${parseFloat(data.total_volume || 0).toFixed(2)}`;
                document.getElementById('user-investment').textContent = `$${parseFloat(data.user_investment || 0).toFixed(2)}`;
                document.getElementById('user-rewards').textContent = `$${parseFloat(data.user_rewards || 0).toFixed(2)}`;
            } else {
                 console.error('Failed to fetch stats:', data.error);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    let attempts = 0;
    const interval = setInterval(() => {
        if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
            clearInterval(interval);
            connectWallet();
        } else {
            attempts++;
            if (attempts > 10) {
                clearInterval(interval);
                statusDiv.textContent = 'Please install and log in to TronLink.';
            }
        }
    }, 500);
});
