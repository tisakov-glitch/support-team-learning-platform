export interface CategoryType {
  name: string;
  actions?: string[];
}

export interface CategoryModule {
  name: string;
  types: CategoryType[];
}

export interface CategorySystem {
  name: string;
  modules: CategoryModule[];
}

export const TICKET_CATEGORIES: CategorySystem[] = [
  {
    name: 'BO',
    modules: [
      {
        name: '(BO) ANNOUNCEMENT',
        types: [
          { name: '(BO) INFO' }
        ]
      },
      {
        name: '(BO) DOCUMENT',
        types: [
          { name: '(BO) CASH OUTFLOW (RKO)' },
          { name: '(BO) DELETION', actions: ['(BO) DELETION'] },
          { name: '(BO) EDITING', actions: ['(BO) EDITING'] },
          { name: '(BO) IMPORT' },
          { name: '(BO) INVENTORY' },
          { name: '(BO) ITEM MASTER' },
          { name: '(BO) ORP' },
          { name: '(BO) PRICE CHANGE DOCUMENT' },
          { name: '(BO) RECOUNTING ORDER' },
          { name: '(BO) TRANSFER' },
          { name: '(BO) TRANSFER ORDERS', actions: ['(BO) DELETION'] },
          { name: '(BO) WRITEOFF' }
        ]
      },
      {
        name: '(BO) EMPLOYEE',
        types: [
          { name: '(BO) ACCESS' },
          { name: '(BO) ACTIVATE' }
        ]
      },
      {
        name: '(BO) EXCHANGE ( INTEGRATION )',
        types: [
          { name: '(BO) BO - ACC', actions: ['(BO) EXPORT \\ UPLOAD'] },
          { name: '(BO) BO - FO' },
          { name: '(BO) BO - IS' },
          { name: '(BO) BO - MJR', actions: ['(BO) EXPORT \\ UPLOAD'] }
        ]
      },
      {
        name: '(BO) MARKETING',
        types: [
          { name: '(BO) GIFT CARD' },
          { name: '(BO) SALE' },
          { name: '(BO) VOUCHER' }
        ]
      },
      {
        name: '(BO) MASTER DATA',
        types: [
          { name: '(BO) ITEM MASTER' }
        ]
      },
      {
        name: '(BO) PERIOD',
        types: [
          { name: '(BO) CLOSE' },
          { name: '(BO) OPEN' }
        ]
      },
      {
        name: '(BO) REPORTS',
        types: [
          { name: '(BO) CASH BOOK' },
          { name: '(BO) DAYLY CASHIER' },
          { name: '(BO) INFORM' },
          { name: '(BO) SET UP' }
        ]
      },
      {
        name: '(BO) UNIFORM',
        types: [
          { name: '(BO) UNIFORM', actions: ['(BO) DELETE'] }
        ]
      }
    ]
  },
  {
    name: 'FO',
    modules: [
      {
        name: '(FO) HUMAN ERROR',
        types: [
          { name: '(FO) CUSTOMER DATA' },
          { name: '(FO) PAYMENT TYPE' }
        ]
      },
      {
        name: '(FO) 1C',
        types: [
          { name: '(FO) CASH DEPOSIT' },
          { name: '(FO) FO VERSION', actions: ['(FO) 1C UPDATE'] },
          { name: '(FO) PRODUCT OVERVIEW' },
          { name: '(FO) RECEIPT NOT PASSED' },
          { name: '(FO) START 1C' }
        ]
      },
      {
        name: '(FO) CAMPAIGN',
        types: [
          { name: '(FO) ACTIVATION' },
          { name: '(FO) DEACTIVATION' },
          { name: '(FO) INFO' },
          { name: '(FO) NOT WORKING' }
        ]
      },
      {
        name: '(FO) CRM',
        types: [
          { name: '(FO) LOYALTY POINTS' }
        ]
      },
      {
        name: '(FO) EMPLOYEE',
        types: [
          { name: '(FO) PASSWORD' }
        ]
      },
      {
        name: '(FO) EXCHANGE (INT)',
        types: [
          { name: '(FO) FO - FOC' },
          { name: '(FO) Z-REPORT - BO' }
        ]
      },
      {
        name: '(FO) FA',
        types: [
          { name: '(FO) EMULATOR', actions: ['(FO) WEB-KASSA'] },
          { name: '(FO) FA ERROR' },
          { name: '(FO) FP DUPLICATION' },
          { name: '(FO) NOT PASSED IN 1C \\ FA' },
          { name: '(FO) OFD' },
          { name: '(FO) RECEIPT DID NOT PRINT' }
        ]
      },
      {
        name: '(FO) RETURN',
        types: [
          { name: '(FO) POS TERMINAL INTEGRATION' },
          { name: '(FO) RETURN ERROR' },
          { name: '(FO) RETURN FORM' },
          { name: '(FO) RETURN LIMIT', actions: ['(FO) DEFECTIVE PRODUCT', '(FO) REGIONAL PERMISSION'] }
        ]
      },
      {
        name: '(FO) SALE',
        types: [
          { name: '(FO) 1C SALES ERROR' },
          { name: '(FO) BANK TERMINAL', actions: ['(FO) INTAGRATION'] },
          { name: '(FO) BARCODE', actions: ['(FO) NO VAT', '(FO) UNKNOWN BARCODE'] },
          { name: '(FO) CREATING SALE RECEIPT' },
          { name: '(FO) DATAMATRIX' },
          { name: '(FO) EMPLOYEE DISCOUNT' },
          { name: '(FO) GIFT CARD' },
          { name: '(FO) PAYMENT TYPE' },
          { name: '(FO) PRICE', actions: ['(FO) INCORRECT PRICE FO', '(FO) INCORRECT PRICE IN LABE', '(FO) INCORRECT PRICE MOTO', '(FO) NO PRICE BO-FOC', '(FO) NO PRICE FOC-FO'] },
          { name: '(FO) RECEIPT COPY' },
          { name: '(FO) RECEIPT FISCALIZATION' },
          { name: '(FO) SALE RECEIPT' },
          { name: '(FO) TYPE OF SALE', actions: ['(FO) PROFORMA INVOICE'] }
        ]
      },
      {
        name: '(FO) SHIFT CLOSURE',
        types: [
          { name: '(FO) CAN NOT CLOSE THE SHIFT' },
          { name: '(FO) EMPTY Z-REPORT' },
          { name: '(FO) RECONCILIATION' },
          { name: '(FO) RED Z-DOCUMENT' }
        ]
      },
      {
        name: '(FO) SHIFT OPENING',
        types: [
          { name: '(FO) PREVIOUS SHIFT NOT CLOSED' }
        ]
      },
      {
        name: '(RD) CONNECTION',
        types: [
          { name: '(RD) INTERNET' }
        ]
      }
    ]
  },
  {
    name: 'HR',
    modules: [
      {
        name: '(HR) EMPLOYEE',
        types: [
          { name: '(HR) CONSULTATION' }
        ]
      }
    ]
  },
  {
    name: 'LCW-ITSM',
    modules: [
      {
        name: '(LCW-ITSM) DOCUMENT',
        types: [
          { name: '(LCW-ITSM) CASH DEPOSIT' },
          { name: '(LCW-ITSM) SALE' }
        ]
      },
      {
        name: '(LCW-ITSM) EXCHANGE',
        types: [
          { name: '(LCW-ITSM) UNTRASFERED DATA' }
        ]
      },
      {
        name: '(LCW-ITSM) RED-POS',
        types: [
          { name: '(LCW-ITSM) 1C' },
          { name: '(LCW-ITSM) INCORRECT DATA' }
        ]
      },
      {
        name: '(LCW-ITSM) REPORT',
        types: [
          { name: '(LCW-ITSM) ORP' }
        ]
      },
      {
        name: '(LCW-ITSM) RETURN',
        types: [
          { name: '(LCW-ITSM) DELETION' }
        ]
      }
    ]
  },
  {
    name: 'LCW-TEAMS',
    modules: [
      {
        name: '(LCW-TEAMS) 1C-DATABASE',
        types: [
          { name: '(LCW-TEAMS) CASH DESK FROZEN' },
          { name: '(LCW-TEAMS) CONFIGURATION UPDATE' },
          { name: '(LCW-TEAMS) GS РАСШИРЕНИЕ' }
        ]
      },
      {
        name: '(LCW-TEAMS) DATAMATRIX',
        types: [
          { name: '(LCW-TEAMS) SALE' }
        ]
      },
      {
        name: '(LCW-TEAMS) POS - PERIPHERALS',
        types: [
          { name: '(LCW-TEAMS) MONITOR' },
          { name: '(LCW-TEAMS) SCANER' }
        ]
      },
      {
        name: '(LCW-TEAMS) REPORT',
        types: [
          { name: '(LCW-TEAMS) CASH OUTFLOW(RKO)' },
          { name: '(LCW-TEAMS) CASH BOOK' }
        ]
      },
      {
        name: '(LCW-TEAMS) RETURN',
        types: [
          { name: '(LCW-TEAMS) D3H' },
          { name: '(LCW-TEAMS) DELETION' },
          { name: '(LCW-TEAMS) INCORRECT RECEIPT' },
          { name: '(LCW-TEAMS) RETURN CASH DESK' },
          { name: '(LCW-TEAMS) RETURN FROM ANOTHER STORE' }
        ]
      },
      {
        name: '(LCW-TEAMS) RMK',
        types: [
          { name: '(LCW-TEAMS) ACCESS' }
        ]
      },
      {
        name: '(LCW-TEAMS) SALE',
        types: [
          { name: '(LCW-TEAMS) 1C RECEIPT' },
          { name: '(LCW-TEAMS) FA' },
          { name: '(LCW-TEAMS) GOODS RECEIPT' },
          { name: '(LCW-TEAMS) GOODS UPLOAD' },
          { name: '(LCW-TEAMS) LOYALTY PROGRAM' },
          { name: '(LCW-TEAMS) POS TERMINAL ERROR' },
          { name: '(LCW-TEAMS) PRICE' }
        ]
      },
      {
        name: '(LCW-TEAMS) SHIFT',
        types: [
          { name: '(LCW-TEAMS) SHIFT CLOSURE', actions: ['(LCW-TEAMS) 1C CLOSURE', '(LCW-TEAMS) RECONCILIATION'] },
          { name: '(LCW-TEAMS) SHIFT OPENING' }
        ]
      }
    ]
  },
  {
    name: 'MP',
    modules: [
      {
        name: '(MP) KASPI',
        types: [
          { name: '(MP) ORDER CANCELING' },
          { name: '(MP) ORDER PROCCESSING IN SPRINT' },
          { name: '(MP) RETURN' },
          { name: '(MP) SPECIFY STORE' },
          { name: '(MP) SPRINT CLOSURE' },
          { name: '(MP) STOCK (OPEN/CLOSE)' },
          { name: '(MP) STOCK BALANCE' },
          { name: '(MP) STOP-LIST' }
        ]
      }
    ]
  },
  {
    name: 'PC',
    modules: [
      {
        name: '(PC) 1C',
        types: [
          { name: '(PC) CASH DESK FROZEN' },
          { name: '(PC) DATA BASE FALL' },
          { name: '(PC) DATA BASE TRANSFER' },
          { name: '(PC) PROGRAM LAUNCH' }
        ]
      },
      {
        name: '(PC) CASH DESK',
        types: [
          { name: '(PC) PASSWORD PC' },
          { name: '(T&T) LM CHZ' },
          { name: '(T&T) PROBLEM WITH PC' }
        ]
      },
      {
        name: '(PC) POS & PERIPHERALS',
        types: [
          { name: '(PC) CASH DESK FREEZES' },
          { name: '(PC) CASH DRAWER' },
          { name: '(PC) CUSTOMER DISPLAY' },
          { name: '(PC) PRINTER' },
          { name: '(PC) SCANER' },
          { name: '(PC) USER' }
        ]
      }
    ]
  },
  {
    name: 'REDIRECT',
    modules: [
      {
        name: '(RD) CONNECTION',
        types: [
          { name: '(RD) INTERNET' }
        ]
      },
      {
        name: '(RD) MANAGER\'S PC',
        types: [
          { name: '(RD) TERMINAL' }
        ]
      },
      {
        name: '(RD) OTHER SYSTEMS',
        types: [
          { name: '(RD) KOTON TERMINAL' },
          { name: '(RD) MOTOROL' },
          { name: '(RD) POS TERMINAL' }
        ]
      },
      {
        name: '(RD) ACC',
        types: [
          { name: '(RD) LOG TO ACC' }
        ]
      },
      {
        name: 'REDIRECT',
        types: [
          { name: '(PC) CASH DESK FREEZES' }
        ]
      }
    ]
  },
  {
    name: 'T&T',
    modules: [
      {
        name: '(T&T) DM',
        types: [
          { name: '(T&T) DM STATUS' },
          { name: '(T&T) MANUAL ORDER' },
          { name: '(T&T) REMARKING' }
        ]
      },
      {
        name: '(T&T) ENTRY INTO CIRCULATION',
        types: [
          { name: '(T&T) ENTRY INTO CIRCULATION' }
        ]
      }
    ]
  }
];
