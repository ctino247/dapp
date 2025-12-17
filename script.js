
document.addEventListener('DOMContentLoaded', () => {
    const CONTRACT_ADDRESS = "TLwZnk6Hycn79aVkCgBjNhzno5nBMm5Q1Q";

    // --- DOM ELEMENTS ---
    const loadingStateEl = document.getElementById('loading-state');
    const connectWalletStateEl = document.getElementById('connect-wallet-state');
    const mainContentEl = document.getElementById('main-content');

    const walletAddressEl = document.getElementById('wallet-address');
    const networkNameEl = document.getElementById('network-name');
    const participationStatusEl = document.getElementById('participation-status');
    const contributionStatusEl = document.getElementById('contribution-status');
    const contributionTimeEl = document.getElementById('contribution-time');
    const participantCountEl = document.getElementById('participant-count');
    const processedTrxEl = document.getElementById('processed-trx');
    const protocolStateEl = document.getElementById('protocol-state');
    const requiredContributionEl = document.querySelector('#main-content .card-content p:first-child');
    const joinButton = document.querySelector('.btn-primary');
    const contractAddressEl = document.getElementById('contract-address');
    const tronscanLinkEl = document.getElementById('tronscan-link');
    const statusMessageEl = document.getElementById('status-message');
    const viewTxLinkEl = document.getElementById('view-tx-link');
    const walletStatusFixedEl = document.getElementById('wallet-status-fixed');


    let tronWeb = null;
    let contract = null;
    let userAddress = null;

    async function init() {
        loadingStateEl.classList.remove('hidden');
        connectWalletStateEl.classList.add('hidden');
        mainContentEl.classList.add('hidden');

        try {
            let retries = 0;
            while (!window.tronWeb && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }

            if (window.tronWeb && window.tronWeb.ready) {
                tronWeb = window.tronWeb;
                console.log("TronLink connected!");

                if (tronWeb.fullNode.host === 'https://api.shasta.trongrid.io') {
                    networkNameEl.textContent = "Shasta Testnet";
                } else if (tronWeb.fullNode.host === 'https://api.trongrid.io') {
                    networkNameEl.textContent = "TRON Mainnet";
                } else {
                    networkNameEl.textContent = "Unknown Network";
                }

                if (tronWeb.fullNode.host !== 'https://api.shasta.trongrid.io') {
                    showStatusMessage("Please switch to the Shasta testnet in your TronLink wallet.", true);
                    showConnectWalletState();
                    return;
                }

                contract = await tronWeb.contract(contractABI.entries, CONTRACT_ADDRESS);
                userAddress = tronWeb.defaultAddress.base58;
                walletAddressEl.textContent = shortenAddress(userAddress);

                contractAddressEl.textContent = shortenAddress(CONTRACT_ADDRESS);
                tronscanLinkEl.href = `https://shasta.tronscan.org/#/contract/${CONTRACT_ADDRESS}`;

                checkLastTx();
                await fetchData();

                loadingStateEl.classList.add('hidden');
                connectWalletStateEl.classList.add('hidden');
                mainContentEl.classList.remove('hidden');
                walletStatusFixedEl.classList.remove('hidden');

            } else {
                console.log("TronLink not found or not ready.");
                showConnectWalletState();
            }
        } catch (error) {
            console.error("Error connecting to TronLink:", error);
            showStatusMessage("Error connecting to TronLink. See console for details.", true);
            showConnectWalletState();
        }
    }

    async function fetchData() {
        if(!contract || !userAddress) return;

        try {
            // --- Protocol Activity ---
            const queueInfo = await contract.getQueueInfo().call();
            const totalJoined = await contract.totalJoined().call();
            const joinAmount = await contract.JOIN_AMOUNT().call();
            const totalProcessed = totalJoined.times(joinAmount);
            const canProcess = await contract.canProcess().call();

            participantCountEl.textContent = queueInfo.length.toString();
            processedTrxEl.textContent = tronWeb.fromSun(totalProcessed);
            const protocolState = canProcess ? "Active" : "Paused";
            protocolStateEl.textContent = protocolState;
            protocolStateEl.className = canProcess ? 'status-active' : 'status-inactive';

            // --- Contribution Status ---
            const economics = await contract.getEconomics().call();
            const isInQueue = await contract.inQueue(userAddress).call();

            requiredContributionEl.textContent = `Required: ${tronWeb.fromSun(economics.joinAmountTRX)} TRX`;

            if (isInQueue) {
                participationStatusEl.textContent = 'Active Participant';
                participationStatusEl.className = 'status-active';
                contributionStatusEl.innerHTML = `<i class="fas fa-check-circle"></i> Status: Contributed`;
                contributionTimeEl.classList.add('hidden');
                joinButton.disabled = true;
                joinButton.innerHTML = '<i class="fas fa-check"></i> Already Participating';
            } else {
                participationStatusEl.textContent = 'Not Participating';
                participationStatusEl.className = 'status-inactive';
                contributionStatusEl.innerHTML = `<i class="fas fa-times-circle"></i> Status: Not Contributed`;
                contributionTimeEl.classList.add('hidden');
                joinButton.disabled = false;
                joinButton.innerHTML = '<i class="fas fa-plus-circle"></i> JOIN SOCIAL CIRCLE';
            }

        } catch (error) {
            console.error("Error fetching contract data:", error);
            showStatusMessage("Error fetching contract data. See console for details.", true);
        }
    }

    async function joinQueue() {
        if (!contract) return;

        joinButton.disabled = true;
        joinButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        showStatusMessage("Please confirm the transaction in your wallet...");

        try {
            const economics = await contract.getEconomics().call();
            const joinAmountSun = economics.joinAmountTRX;

            const txID = await contract.joinQueue().send({
                callValue: joinAmountSun,
                shouldPollResponse: false
            });

            localStorage.setItem('lastTxId', txID);
            console.log("Transaction sent:", txID);
            showStatusMessage("Transaction sent! Waiting for confirmation...");
            checkLastTx();

            await awaitTransactionConfirmation(txID);
            console.log("Transaction confirmed!");
            showStatusMessage("Successfully joined the queue!", false);

        } catch (error) {
            console.error("Error sending join transaction:", error);
            showStatusMessage("Transaction failed or was rejected. See console for details.", true);
        } finally {
            await fetchData();
        }
    }

    async function awaitTransactionConfirmation(txID) {
        let retries = 0;
        while (retries < 20) {
            try {
                const result = await tronWeb.trx.getTransactionInfo(txID);
                if (result.id && result.receipt && result.receipt.result === 'SUCCESS') {
                    return;
                }
            } catch (error) {
                // Ignore
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
            retries++;
        }
        throw new Error("Transaction confirmation timed out.");
    }

    function checkLastTx() {
        const lastTxId = localStorage.getItem('lastTxId');
        if(lastTxId) {
            viewTxLinkEl.href = `https://shasta.tronscan.org/#/transaction/${lastTxId}`;
            viewTxLinkEl.classList.remove('hidden');
        }
    }

    function showStatusMessage(message, isError = false) {
        statusMessageEl.textContent = message;
        statusMessageEl.className = isError ? 'card-description status-error' : 'card-description';
    }

    function showConnectWalletState() {
        loadingStateEl.classList.add('hidden');
        connectWalletStateEl.classList.remove('hidden');
        mainContentEl.classList.add('hidden');
    }

    function shortenAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }


    // --- EVENT LISTENERS ---
    const connectWalletButton = document.querySelector('#connect-wallet-state .btn-primary');
    connectWalletButton.addEventListener('click', init);

    const refreshButton = document.querySelector('.btn-text');
    refreshButton.addEventListener('click', () => {
        showStatusMessage("Refreshing data...");
        fetchData().then(() => showStatusMessage("Data refreshed!"));
    });

    joinButton.addEventListener('click', joinQueue);

    window.addEventListener('message', function (e) {
        if (e.data.message && e.data.message.action == 'accountsChanged') {
            console.log("Account changed, re-initializing...");
            init();
        }
    });


    // --- INITIALIZATION ---
    function initializeApp() {
        if (window.tronWeb && window.tronWeb.ready) {
            init();
        } else {
            showConnectWalletState();
        }
    }

    // Listen for the event that TronLink injects
    window.addEventListener('tronweb#initialized', initializeApp);

    // Fallback for cases where the event has already fired
    setTimeout(initializeApp, 1000);

    setInterval(fetchData, 30000);
});
