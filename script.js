let transactions = [];
let tokenTransactions = [];
let currentPage = 1;
let currentTokenPage = 1;
const itemsPerPage = 20;
let web3;

document.addEventListener('DOMContentLoaded', () => {
    try {
        web3 = new Web3();
    } catch (error) {
        console.error("Greška pri inicijalizaciji Web3:", error);
        showError("main-error", "Nije moguće inicijalizovati Web3. Proverite konzolu za više detalja.");
    }
    
    document.getElementById('balanceDate').valueAsDate = new Date();
    
    document.getElementById('searchBtn').addEventListener('click', getTransactions);
    document.getElementById('checkBalanceBtn').addEventListener('click', checkBalanceAtDate);
    
    document.getElementById('walletAddress').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') getTransactions();
    });
    document.getElementById('startBlock').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') getTransactions();
    });
});

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }
}

function formatAddress(address) {
    if (!address) return "-";
    return address.slice(0, 8) + '...' + address.slice(-6);
}

function weiToEth(wei) {
    try {
        return parseFloat(web3.utils.fromWei(wei.toString(), 'ether')).toFixed(6);
    } catch (error) {
        console.error("Greška pri konverziji Wei u ETH:", error);
        return "0.000000";
    }
}

function isValidEthereumAddress(address) {
    try {
        return web3.utils.isAddress(address);
    } catch (error) {
        console.error("Greška pri validaciji adrese:", error);
        return false;
    }
}

async function getTransactions() {
    const address = document.getElementById('walletAddress').value.trim();
    const startBlock = document.getElementById('startBlock').value.trim();
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const errorElement = document.getElementById('error');
    const loadingElement = document.getElementById('loading');
    
    errorElement.textContent = "";
    document.getElementById('summaryInfo').textContent = "";
    document.getElementById('pagination').innerHTML = "";
    document.getElementById('transactionsBody').innerHTML = "";
    document.getElementById('tokenResults').style.display = "none";
    
    if (!address || !startBlock) {
        showError('error', "Molimo unesite adresu novčanika i početni blok");
        return;
    }

    if (!isValidEthereumAddress(address)) {
        showError('error', "Unesite validnu Ethereum adresu");
        return;
    }

    if (isNaN(parseInt(startBlock)) || parseInt(startBlock) < 0) {
        showError('error', "Početni blok mora biti pozitivan broj");
        return;
    }

    if (!apiKey) {
        showError('error', "Potreban je Etherscan API ključ");
        return;
    }
    
    loadingElement.style.display = "block";
    
    try {
        const txs = await fetchTransactions(address, startBlock, apiKey);
        
        const internalTxs = await fetchInternalTransactions(address, startBlock, apiKey);
        
        tokenTransactions = await fetchTokenTransactions(address, startBlock, apiKey);
        
        transactions = [...txs, ...internalTxs].sort((a, b) => 
            parseInt(a.blockNumber) - parseInt(b.blockNumber)
        );

        currentPage = 1;
        currentTokenPage = 1;
        
        displayTransactions();
        
        if (tokenTransactions.length > 0) {
            document.getElementById('tokenResults').style.display = "block";
            document.getElementById('tokenSummaryInfo').textContent = `Pronađeno ${tokenTransactions.length} token transakcija.`;
            displayTokenTransactions();
        }
    } catch (error) {
        showError('error', "Greška: " + error.message);
    } finally {
        loadingElement.style.display = "none";
    }
}

async function fetchTransactions(address, startBlock, apiKey) {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=99999999&sort=asc&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "1") {
        const allTxs = data.result || [];

        const outTxs = allTxs.filter(tx => tx.from.toLowerCase() === address.toLowerCase());
        const inTxs = allTxs.filter(tx => tx.to && tx.to.toLowerCase() === address.toLowerCase() && tx.from.toLowerCase() !== address.toLowerCase());

        outTxs.forEach(tx => tx.type = "Odlazna");
        inTxs.forEach(tx => tx.type = "Dolazna");

        return [...outTxs, ...inTxs];
    } else if (data.message === "No transactions found") {
        return [];
    } else {
        throw new Error(data.message || "Greška pri dobavljanju transakcija");
    }
}

async function fetchInternalTransactions(address, startBlock, apiKey) {
    const url = `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${address}&startblock=${startBlock}&endblock=99999999&sort=asc&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "1") {
        const allTxs = data.result || [];

        const outTxs = allTxs.filter(tx => tx.from.toLowerCase() === address.toLowerCase());
        const inTxs = allTxs.filter(tx => tx.to && tx.to.toLowerCase() === address.toLowerCase() && tx.from.toLowerCase() !== address.toLowerCase());

        outTxs.forEach(tx => {
            tx.type = "Odlazna (Internal)";
            if (!tx.gasPrice) tx.gasPrice = "0";
        });
        
        inTxs.forEach(tx => {
            tx.type = "Dolazna (Internal)";
            if (!tx.gasPrice) tx.gasPrice = "0";
        });

        return [...outTxs, ...inTxs];
    } else if (data.message === "No transactions found") {
        return [];
    } else {
        throw new Error(data.message || "Greška pri dobavljanju internih transakcija");
    }
}

async function fetchTokenTransactions(address, startBlock, apiKey) {
    try {
        const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=${startBlock}&endblock=99999999&sort=asc&apikey=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === "1") {
            const allTxs = data.result || [];
            
            allTxs.forEach(tx => {
                if (tx.from.toLowerCase() === address.toLowerCase()) {
                    tx.type = "Odlazna Token";
                } else if (tx.to.toLowerCase() === address.toLowerCase()) {
                    tx.type = "Dolazna Token";
                } else {
                    tx.type = "Druga";
                }
            });
            
            return allTxs;
        } else if (data.message === "No transactions found") {
            return [];
        } else {
            throw new Error(data.message || "Greška pri dobavljanju token transakcija");
        }
    } catch (error) {
        console.error("Greška pri dobavljanju token transakcija:", error);
        throw error;
    }
}

function displayTransactions() {
    const tableBody = document.getElementById('transactionsBody');
    const summaryInfo = document.getElementById('summaryInfo');
    const paginationContainer = document.getElementById('pagination');
    
    tableBody.innerHTML = '';
    paginationContainer.innerHTML = '';
    
    summaryInfo.textContent = `Pronađeno ${transactions.length} transakcija.`;
    
    if (transactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" style="text-align: center;">Nema pronađenih transakcija</td>';
        tableBody.appendChild(row);
        return;
    }
    
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    
    if (totalPages > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Prethodna';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayTransactions();
            }
        });
        paginationContainer.appendChild(prevButton);
        
        const pageInfo = document.createElement('span');
        pageInfo.textContent = ` Strana ${currentPage} od ${totalPages} `;
        paginationContainer.appendChild(pageInfo);
        
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Sledeća';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayTransactions();
            }
        });
        paginationContainer.appendChild(nextButton);
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, transactions.length);
    const pageTransactions = transactions.slice(start, end);
    
    pageTransactions.forEach(tx => {
        const row = document.createElement('tr');
        
        const date = new Date(parseInt(tx.timeStamp) * 1000);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        const gasUsed = tx.gasUsed || 0;
        const gasPrice = tx.gasPrice || 0;
        const gasCost = weiToEth(BigInt(gasUsed) * BigInt(gasPrice));
        
        row.innerHTML = `
            <td>${tx.blockNumber}</td>
            <td>${formattedDate}</td>
            <td>${tx.type}</td>
            <td class="address" title="${tx.from}">${formatAddress(tx.from)}</td>
            <td class="address" title="${tx.to || '-'}">${formatAddress(tx.to)}</td>
            <td>${weiToEth(tx.value)}</td>
            <td>${gasCost}</td>
            <td class="address" title="${tx.hash}">
                <a href="https://etherscan.io/tx/${tx.hash}" target="_blank">
                    ${formatAddress(tx.hash)}
                </a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function displayTokenTransactions() {
    const tableBody = document.getElementById('tokenTransactionsBody');
    const paginationContainer = document.getElementById('tokenPagination');
    
    tableBody.innerHTML = '';
    paginationContainer.innerHTML = '';
    
    if (tokenTransactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" style="text-align: center;">Nema pronađenih token transakcija</td>';
        tableBody.appendChild(row);
        return;
    }
    
    const totalPages = Math.ceil(tokenTransactions.length / itemsPerPage);
    
    if (totalPages > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Prethodna';
        prevButton.disabled = currentTokenPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentTokenPage > 1) {
                currentTokenPage--;
                displayTokenTransactions();
            }
        });
        paginationContainer.appendChild(prevButton);
        
        const pageInfo = document.createElement('span');
        pageInfo.textContent = ` Strana ${currentTokenPage} od ${totalPages} `;
        paginationContainer.appendChild(pageInfo);
        
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Sledeća';
        nextButton.disabled = currentTokenPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentTokenPage < totalPages) {
                currentTokenPage++;
                displayTokenTransactions();
            }
        });
        paginationContainer.appendChild(nextButton);
    }
    
    const start = (currentTokenPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, tokenTransactions.length);
    const pageTransactions = tokenTransactions.slice(start, end);
    
    pageTransactions.forEach(tx => {
        const row = document.createElement('tr');
        
        const date = new Date(parseInt(tx.timeStamp) * 1000);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        const tokenValue = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
        const formattedValue = tokenValue.toFixed(6);
        
        row.innerHTML = `
            <td>${tx.tokenName} (${tx.tokenSymbol})</td>
            <td>${tx.blockNumber}</td>
            <td>${formattedDate}</td>
            <td>${tx.type}</td>
            <td class="address" title="${tx.from}">${formatAddress(tx.from)}</td>
            <td class="address" title="${tx.to || '-'}">${formatAddress(tx.to)}</td>
            <td>${formattedValue}</td>
            <td class="address" title="${tx.hash}">
                <a href="https://etherscan.io/tx/${tx.hash}" target="_blank">
                    ${formatAddress(tx.hash)}
                </a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

async function checkBalanceAtDate() {
    const address = document.getElementById('balanceWalletAddress').value.trim();
    const dateString = document.getElementById('balanceDate').value;
    const apiKey = document.getElementById('balanceApiKey').value.trim();
    const errorElement = document.getElementById('balanceError');
    const loadingElement = document.getElementById('balanceLoading');
    const resultElement = document.getElementById('balanceResult');
    
    errorElement.textContent = "";
    resultElement.textContent = "";
    
    if (!address || !dateString) {
        showError('balanceError', "Molimo unesite adresu novčanika i datum");
        return;
    }

    if (!isValidEthereumAddress(address)) {
        showError('balanceError', "Unesite validnu Ethereum adresu");
        return;
    }

    if (!apiKey) {
        showError('balanceError', "Potreban je Etherscan API ključ");
        return;
    }

    loadingElement.style.display = "block";
    
    try {
        const targetDate = new Date(dateString + "T00:00:00Z");
        const targetTimestamp = Math.floor(targetDate.getTime() / 1000);
        
        if (isNaN(targetTimestamp)) {
            throw new Error("Nevažeći format datuma");
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        if (targetTimestamp > currentTime) {
            throw new Error("Datum ne može biti u budućnosti");
        }
        
        const targetBlockUrl = `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${targetTimestamp}&closest=before&apikey=${apiKey}`;
        const targetBlockResponse = await fetch(targetBlockUrl);
        const targetBlockData = await targetBlockResponse.json();
        
        if (targetBlockData.status !== "1") {
            throw new Error(targetBlockData.message || "Greška pri dobavljanju ciljanog bloka");
        }
        
        const targetBlock = parseInt(targetBlockData.result);
        
        let ethBalance = await calculateBalanceAtBlock(address, targetBlock, apiKey);
        
        let tokenBalances = await getTokenBalancesAtBlock(address, targetBlock, apiKey);
        
        const formattedDate = targetDate.toLocaleDateString();
        
        let resultHTML = `<h3>Stanje na dan ${formattedDate} (blok ${targetBlock}):</h3>`;
        resultHTML += `<p><strong>ETH:</strong> ${weiToEth(ethBalance)} ETH</p>`;
        
        if (tokenBalances.length > 0) {
            resultHTML += `<h4>Token stanja:</h4><ul>`;
            tokenBalances.forEach(token => {
                resultHTML += `<li><strong>${token.name} (${token.symbol}):</strong> ${token.balance}</li>`;
            });
            resultHTML += `</ul>`;
        }
        
        resultElement.innerHTML = resultHTML;
        
    } catch (error) {
        showError('balanceError', "Greška: " + error.message);
    } finally {
        loadingElement.style.display = "none";
    }
}

async function calculateBalanceAtBlock(address, targetBlock, apiKey) {
    let balance = BigInt(0);
    let normalTxs = [];
    let internalTxs = [];
    
    try {
        const normalTxUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=${targetBlock}&sort=asc&apikey=${apiKey}`;
        const normalTxResponse = await fetch(normalTxUrl);
        const normalTxData = await normalTxResponse.json();
        
        if (normalTxData.status === "1") {
            normalTxs = normalTxData.result || [];
        } else if (normalTxData.message !== "No transactions found") {
            throw new Error(normalTxData.message || "Greška pri dobavljanju transakcija");
        }
        
        const internalTxUrl = `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=${targetBlock}&sort=asc&apikey=${apiKey}`;
        const internalTxResponse = await fetch(internalTxUrl);
        const internalTxData = await internalTxResponse.json();
        
        if (internalTxData.status === "1") {
            internalTxs = internalTxData.result || [];
        } else if (internalTxData.message !== "No transactions found") {
            throw new Error(internalTxData.message || "Greška pri dobavljanju internih transakcija");
        }
        
        const allTxs = [...normalTxs, ...internalTxs];
        
        allTxs.forEach(tx => {
            if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
                balance += BigInt(tx.value);
            }
            
            if (tx.from && tx.from.toLowerCase() === address.toLowerCase()) {
                balance -= BigInt(tx.value);
                
                if (tx.gasUsed && tx.gasPrice && tx.isError !== "1") {
                    const gasCost = BigInt(tx.gasUsed) * BigInt(tx.gasPrice);
                    balance -= gasCost;
                }
            }
        });
        
        return balance;
    } catch (error) {
        console.error("Greška pri računanju stanja:", error);
        throw error;
    }
}

async function getTokenBalancesAtBlock(address, targetBlock, apiKey) {
    try {
        const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=${targetBlock}&sort=asc&apikey=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status !== "1" && data.message !== "No transactions found") {
            throw new Error(data.message || "Greška pri dobavljanju token transakcija");
        }
        
        const tokenTxs = data.status === "1" ? data.result : [];
        
        const tokenBalances = {};
        
        tokenTxs.forEach(tx => {
            const tokenKey = tx.contractAddress.toLowerCase();
            
            if (!tokenBalances[tokenKey]) {
                tokenBalances[tokenKey] = {
                    name: tx.tokenName,
                    symbol: tx.tokenSymbol,
                    decimals: parseInt(tx.tokenDecimal),
                    balance: BigInt(0)
                };
            }
            
            if (tx.to.toLowerCase() === address.toLowerCase()) {
                tokenBalances[tokenKey].balance += BigInt(tx.value);
            }
            
            if (tx.from.toLowerCase() === address.toLowerCase()) {
                tokenBalances[tokenKey].balance -= BigInt(tx.value);
            }
        });
        
        return Object.values(tokenBalances).map(token => {
            const formattedBalance = Number(token.balance) / Math.pow(10, token.decimals);
            return {
                name: token.name,
                symbol: token.symbol,
                balance: formattedBalance.toFixed(6)
            };
        });
        
    } catch (error) {
        console.error("Greška pri dobavljanju stanja tokena:", error);
        return [];
    }
}