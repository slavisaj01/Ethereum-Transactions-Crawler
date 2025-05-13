# Ethereum-Transactions-Crawler

Ova aplikacija omogućava korisnicima da pretražuju Ethereum transakcije i 
proveravaju stanje ETH i ERC-20 tokena na određeni datum, koristeći Etherscan API.

## Funkcionalnosti
- Pretraga normalnih, internih i ERC-20 transakcija
- Unos početnog bloka za pretragu
- Paginacija rezultata
- Provera ETH i token stanja na određeni datum

## Tehnologije
- HTML, CSS, JavaScript
- Web3.js
- Etherscan API

## Pokretanje
1. Klonirajte repozitorijum
2. Otvorite `index.html` u pretraživaču
3. Unesite Ethereum adresu, API ključ i kliknite na "Pretraži"

## Uputstvo za korišćenje
Pretraga transakcija:
Unesite Ethereum adresu (npr. 0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f)

Postavite početni blok (npr. 9000000)

Upišite svoj Etherscan API ključ

Kliknite na Pretraži

Transakcije će biti prikazane u tabeli sa mogućnošću prelaska kroz stranice

## Provera stanja na određeni datum:
U odeljku za proveru stanja unesite adresu i datum

Dodajte API ključ

Kliknite na Proveri stanje

Sistem prikazuje stanje ETH i ERC-20 tokena za taj datum

## Napomena
Za rad aplikacije potreban je besplatan Etherscan API ključ: [https://etherscan.io/apis](https://etherscan.io/apis)
