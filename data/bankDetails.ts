// Official Store Bank, EasyPaisa & Raast Transfer Information

export interface BankAccountInfo {
  bankName: string;
  branch: string;
  accountTitle: string;
  accountNumber: string;
  cleanAccountNumber: string;
  iban: string;
}

export const STORE_BANK_DETAILS = {
  accountTitle: 'Muhammad Jahangir Mazhar',
  raastId: '03358543131',
  raastTitle: 'Muhammad Jahangir Mazhar',
  easypaisaNumber: '03358543131',
  easypaisaTitle: 'Muhammad Jahangir Mazhar',
  primaryBank: {
    bankName: 'Meezan Bank Ltd',
    branch: 'Main Commercial Branch',
    accountTitle: 'Muhammad Jahangir Mazhar',
    accountNumber: '0201-0108920192',
    cleanAccountNumber: '02010108920192',
    iban: 'PK42MEZN0002010108920192',
  },
  secondaryBank: {
    bankName: 'Bank Alfalah',
    branch: 'Islamic Banking Branch',
    accountTitle: 'Muhammad Jahangir Mazhar',
    accountNumber: '5501-5001239871',
    cleanAccountNumber: '55015001239871',
    iban: 'PK12ALFH55015001239871',
  },
  whatsappHelpline: '+92 313 5221200',
  whatsappRaw: '923135221200',
};
