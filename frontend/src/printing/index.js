export {
  buildKitchenTicketHtml
} from './kitchenTemplate'

export {
  buildCustomerReceiptHtml
} from './customerReceiptTemplate'

export {
  sendPrintJob,
  printKitchenOrder,
  printCustomerReceipt,
  printOrderDocuments,
  printManualReceipt
} from './printerService'

export {
  default as printerService
} from './printerService'
