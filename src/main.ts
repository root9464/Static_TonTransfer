import { Address, beginCell, toNano } from '@ton/core';
import { TonConnectUI } from '@tonconnect/ui';
import { fetchMintersList } from './utils';

const buttonTon = document.getElementById('ton') as HTMLButtonElement;
const buttonAJetton = document.getElementById('all-jettons') as HTMLButtonElement;
const buttonJetton = document.getElementById('jetton-btn') as HTMLButtonElement;

const inputAddress = document.getElementById('address') as HTMLInputElement; // Адрес кошелька
const freindAddress = document.getElementById('userFriendlyAddress') as HTMLInputElement; // Адрес друга
const jettonAddress = document.getElementById('jettonAmount') as HTMLInputElement; // Адрес жетона

const tonConnectUI = new TonConnectUI({
  manifestUrl: 'https://taiga-labs.github.io/dexlot.json',
  buttonRootId: 'ton-connect',
});

buttonAJetton.onclick = async () => {
  const owner = tonConnectUI.account?.address;

  if (!owner) {
    throw new Error('Account is required');
  }

  const minters_list = await fetchMintersList(owner);
  const jettons_list = document.getElementById('jettons') as HTMLDivElement;

  for (let iter: number = 0; iter < minters_list.length; iter += 1) {
    const jetton = document.createElement('div');
    jetton.textContent = `${minters_list[iter].symbol} - ${minters_list[iter].wallet_adress}`;
    jettons_list.appendChild(jetton);
  }
};

buttonTon.onclick = async () => {
  const address = inputAddress.value; // Адрес кошелька (ton address)
  if (!address) {
    throw new Error('Address is required');
  }

  const transaction = {
    validUntil: Date.now() + 1000 * 60 * 60,
    messages: [
      {
        address: address, // получатель
        amount: toNano('0.01').toString(),
      },
    ],
  };

  const result = await tonConnectUI.sendTransaction(transaction);
  console.log('Transaction result:', result);
};

//ебал я рот ваших жетонов
buttonJetton.onclick = async () => {
  const owner = tonConnectUI.account?.address; // Адрес кошелька отправителя
  const friend = freindAddress.value; // Адрес получателя
  const jetton = jettonAddress.value; // Адрес жетона

  // Проверка на наличие адресов
  if (!owner || !jetton || !friend) {
    throw new Error('All addresses are required');
  }

  // Составляем тело транзакции
  const body = beginCell()
    .storeUint(0xf8a7ea5, 32) // jetton transfer op code
    .storeUint(0, 64) // query_id:uint64
    .storeCoins(10000000) // amount:(VarUInteger 16)
    .storeAddress(Address.parse(friend)) // от кого
    .storeAddress(Address.parse(owner)) //кому
    .storeUint(0, 1) // custom_payload:(Maybe ^Cell)
    .storeCoins(50000000) // forward_ton_amount:(VarUInteger 16)
    .storeUint(0, 1) // forward_payload:(Either Cell ^Cell)
    .endCell();

  const myTransaction = {
    validUntil: Math.floor(Date.now() / 1000) + 60, // Время действия транзакции (60 секунд)
    messages: [
      {
        address: jetton, // Адрес контракта жетона
        amount: (100000000).toString(), // Комиссия в тонах (если требуется)
        payload: body.toBoc().toString('base64'), // Тело транзакции
      },
    ],
  };

  await tonConnectUI.sendTransaction(myTransaction);
};
