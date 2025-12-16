
document.addEventListener('DOMContentLoaded', () => {
    // --- MOCK DATA ---
    const MOCK_DATA = {
        walletConnected: false, // Set to false to show the "Connect Wallet" state by default
        walletAddress: '0x1a2b...c3d4',
        isParticipant: true,
        contribution: {
            required: 80,
            status: 'Contributed',
            timestamp: '2024-01-15 14:30',
        },
        protocol: {
            participants: 1247,
            processedTRX: 45280,
            state: 'Active',
        },
    };

    // --- DOM ELEMENTS ---
    const loadingStateEl = document.getElementById('loading-state');
    const connectWalletStateEl = document.getElementById('connect-wallet-state');
    const mainContentEl = document.getElementById('main-content');

    const walletAddressEl = document.getElementById('wallet-address');
    const participationStatusEl = document.getElementById('participation-status');
    const contributionStatusEl = document.getElementById('contribution-status');
    const contributionTimeEl = document.getElementById('contribution-time');
    const participantCountEl = document.getElementById('participant-count');
    const processedTrxEl = document.getElementById('processed-trx');
    const protocolStateEl = document.getElementById('protocol-state');

    // --- FUNCTIONS ---
    function updateUI(data) {
        if (data.walletConnected) {
            walletAddressEl.textContent = data.walletAddress;
            participationStatusEl.textContent = data.isParticipant ? 'Active Participant' : 'Not Participating';
            participationStatusEl.className = data.isParticipant ? 'status-active' : 'status-inactive';

            contributionStatusEl.innerHTML = `<i class="fas fa-check-circle"></i> Status: ${data.contribution.status}`;
            contributionTimeEl.innerHTML = `<i class="fas fa-clock"></i> Time: ${data.contribution.timestamp}`;
            participantCountEl.textContent = data.protocol.participants;
            processedTrxEl.textContent = data.protocol.processedTRX;
            protocolStateEl.textContent = data.protocol.state;
            protocolStateEl.className = data.protocol.state === 'Active' ? 'status-active' : 'status-inactive';

            loadingStateEl.classList.add('hidden');
            connectWalletStateEl.classList.add('hidden');
            mainContentEl.classList.remove('hidden');
        } else {
            loadingStateEl.classList.add('hidden');
            connectWalletStateEl.classList.remove('hidden');
            mainContentEl.classList.add('hidden');
        }
    }

    // --- EVENT LISTENERS ---
    const refreshButton = document.querySelector('.btn-text');
    refreshButton.addEventListener('click', () => {
        // Simulate data refresh
        MOCK_DATA.protocol.participants += Math.floor(Math.random() * 10);
        MOCK_DATA.protocol.processedTRX += Math.floor(Math.random() * 100);
        updateUI(MOCK_DATA);
    });

    const connectWalletButton = document.querySelector('#connect-wallet-state .btn-primary');
    connectWalletButton.addEventListener('click', () => {
        // Simulate wallet connection
        MOCK_DATA.walletConnected = true;
        updateUI(MOCK_DATA);
    });

    // --- INITIALIZATION ---
    // Simulate initial loading time
    setTimeout(() => {
        updateUI(MOCK_DATA);
    }, 2000);

    // Simulate real-time updates
    setInterval(() => {
        if (MOCK_DATA.walletConnected) {
            MOCK_DATA.protocol.participants += 1;
            MOCK_DATA.protocol.processedTRX += 10;
            updateUI(MOCK_DATA);
        }
    }, 30000);
});
