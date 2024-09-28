import axios from 'axios';

export type jettons_info = {
  symbol: string;
  image: string;
  minter_address: string;
  current_balance: string;
  decimals: string;
};

export async function get_minters_list(ton_api_url: string): Promise<jettons_info[]> {
  let minters_list: jettons_info[] = [];
  const result = await (await fetch(ton_api_url)).text();
  const response_list = JSON.parse(result);
  const balances = response_list['balances'];

  for (let iter: number = 0; iter < balances.length; iter += 1) {
    if (balances[iter]['balance'] == 0) continue;

    const acount_id = balances[iter]['jetton']['address'];
    const base64url_address_data = await (await fetch(`https://tonapi.io/v2/address/0%3A${acount_id.slice(2, acount_id.length)}/parse`)).text();
    const base64url_address = JSON.parse(base64url_address_data)['bounceable']['b64url'];
    minters_list.push({
      symbol: balances[iter]['jetton']['symbol'],
      image: balances[iter]['jetton']['image'],
      minter_address: String(base64url_address),
      current_balance: balances[iter]['balance'],
      decimals: balances[iter]['jetton']['decimals'],
    });
  }
  return minters_list;
}

export type JettonsInfo = {
  decimals: number;
  wallet_adress: string;
  minter_address: string;
  current_balance: number;
  symbol: string;
  image: string;
};

type ResponseJettons = {
  balances: Array<{
    balance: string;
    jetton: {
      address: string;
      decimals: number;
      image: string;
      name: string;
      symbol: string;
      verification: string;
    };
    wallet_address: {
      address: string;
      is_scam: boolean;
      is_wallet: boolean;
    };
  }>;
};

export type JsonParseData = {
  raw_form: string;
  bounceable: { b64: string; b64url: string };
  non_bounceable: { b64: string; b64url: string };
  given_type: string;
  test_only: boolean;
};

export const fetchMintersList = async (address: string) => {
  if (!address) {
    return [];
  }

  const response = await axios.get<ResponseJettons>(`https://tonapi.io/v2/accounts/${address}/jettons`);
  const { balances } = response.data;

  const mintersList = await Promise.all(
    balances
      .filter((balance) => Number(balance.balance) > 0)
      .map(async (balance) => {
        const acountId = balance.jetton.address;
        const walletId = balance.wallet_address.address;
        console.log(acountId, walletId);
        const base64urlAddress = await axios
          .get<JsonParseData>(`https://tonapi.io/v2/address/0%3A${acountId.slice(2, acountId.length)}/parse`)
          .then((response) => response.data.bounceable.b64url);

        const walletAddress = await axios
          .get<JsonParseData>(`https://tonapi.io/v2/address/0%3A${walletId.slice(2, walletId.length)}/parse`)
          .then((response) => response.data.bounceable.b64url);

        return {
          decimals: balance.jetton.decimals,
          symbol: balance.jetton.symbol,
          current_balance: Number(balance.balance),
          minter_address: base64urlAddress,
          wallet_adress: walletAddress,
          image: balance.jetton.image,
        };
      }),
  );

  return mintersList;
};
