/*
 * このファイルを使用するには、secrets に PDF_SERVICES_CLIENT_ID と PDF_SERVICES_CLIENT_SECRET を指定する必要があります。
 * ```
 * secrets: ['PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
 * ```
 */

import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  CreatePDFResult,
  Asset,
  DocumentMergeJob,
  DocumentMergeParams,
  OutputFormat,
} from '@adobe/pdfservices-node-sdk'
import { defineSecret } from 'firebase-functions/params'
import fs from 'fs'

const PDF_SERVICES_CLIENT_ID = defineSecret('PDF_SERVICES_CLIENT_ID')
const PDF_SERVICES_CLIENT_SECRET = defineSecret('PDF_SERVICES_CLIENT_SECRET')

interface ResultAsset extends Asset {
  _assetId: string
  _downloadURI: string
}

export class PdfGenerator {
  private pdfServices: PDFServices

  constructor() {
    const credentials = new ServicePrincipalCredentials({
      clientId: PDF_SERVICES_CLIENT_ID.value(),
      clientSecret: PDF_SERVICES_CLIENT_SECRET.value(),
    })

    this.pdfServices = new PDFServices({ credentials: credentials })
  }

  private async _executeDocumentMerge(
    templateDocxPath: string,
    jsonDataForMerge: object,
  ): Promise<ResultAsset | undefined> {
    const inputAsset: Asset = await this.pdfServices.upload({
      readStream: fs.createReadStream(templateDocxPath),
      mimeType: MimeType.DOCX,
    })

    const documentMergeParams = new DocumentMergeParams({
      jsonDataForMerge,
      outputFormat: OutputFormat.PDF,
    })

    const job: DocumentMergeJob = new DocumentMergeJob({
      inputAsset,
      params: documentMergeParams,
    })

    const pollingURL: string = await this.pdfServices.submit({ job })

    // ジョブの完了を待機
    const result = await this.pdfServices.getJobResult({
      pollingURL: pollingURL,
      resultType: CreatePDFResult,
    })

    return result.result?.asset as ResultAsset | undefined
  }

  async executeDocumentMergeForUrl(templateDocxPath: string, jsonDataForMerge: object): Promise<string | undefined> {
    const resultAsset = await this._executeDocumentMerge(templateDocxPath, jsonDataForMerge)
    return resultAsset?._downloadURI
  }

  async executeDocumentMergeForStream(
    templateDocxPath: string,
    jsonDataForMerge: object,
  ): Promise<NodeJS.ReadableStream> {
    const resultAsset = await this._executeDocumentMerge(templateDocxPath, jsonDataForMerge)
    const streamAsset = await this.pdfServices.getContent({
      asset: resultAsset!,
    })
    return streamAsset.readStream
  }
}
