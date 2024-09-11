import { defineString } from 'firebase-functions/params'
import PDFServicesSdk from '@adobe/pdfservices-node-sdk'

export const makePdf = async (templateDocx, jsonDataForMerge, writableStream) => {
  const PDF_SERVICES_CLIENT_ID = defineString('PDF_SERVICES_CLIENT_ID')
  const PDF_SERVICES_CLIENT_SECRET = defineString('PDF_SERVICES_CLIENT_SECRET')

  // Initial setup, create credentials instance.
  const credentials = PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
    .withClientId(PDF_SERVICES_CLIENT_ID.value())
    .withClientSecret(PDF_SERVICES_CLIENT_SECRET.value())
    .build()

  // Create an ExecutionContext using credentials
  const executionContext = PDFServicesSdk.ExecutionContext.create(credentials)

  // Create a new DocumentMerge options instance
  const documentMerge = PDFServicesSdk.DocumentMerge
  const options = new documentMerge.options.DocumentMergeOptions(
    jsonDataForMerge,
    documentMerge.options.OutputFormat.PDF,
  )

  // Create a new operation instance using the options instance
  const documentMergeOperation = documentMerge.Operation.createNew(options)

  // Set operation input document template from a source file.
  const input = PDFServicesSdk.FileRef.createFromLocalFile(templateDocx)
  documentMergeOperation.setInput(input)

  // Execute the operation and Save the result to the specified location.
  const result = await documentMergeOperation.execute(executionContext)
  result.writeToStream(writableStream)
}
