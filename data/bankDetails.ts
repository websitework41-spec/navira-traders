// Official Store Bank & Raast Transfer Information for Nawira Traders

export interface BankAccountInfo {
  bankName: string;
  branch: string;
  accountTitle: string;
  accountNumber: string;
  cleanAccountNumber: string;
  iban: string;
}

export const STORE_BANK_DETAILS = {
  accountTitle: 'Nawira Traders',
  raastId: '03018543131',
  raastTitle: 'Nawira Traders',
  primaryBank: {
    bankName: 'Meezan Bank Ltd',
    branch: 'Main Commercial Branch',
    accountTitle: 'Nawira Traders',
    accountNumber: '0201-0108920192',
    cleanAccountNumber: '02010108920192',
    iban: 'PK42MEZN0002010108920192',
  },
  secondaryBank: {
    bankName: 'Bank Alfalah',
    branch: 'Islamic Banking Branch',
    accountTitle: 'Nawira Traders',
    accountNumber: '5501-5001239871',
    cleanAccountNumber: '55015001239871',
    iban: 'PK12ALFH55015001239871',
  },
  whatsappHelpline: '+92 301 8543131',
  whatsappRaw: '923018543131',
};
