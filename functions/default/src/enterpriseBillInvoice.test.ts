import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Readable, Writable } from 'stream'
import { Enterprise, EnterpriseBillingSnapshot, EnterpriseInvoiceFile } from '@shokujii/common/schemas/Enterprise.js'

const mockGcsFile = {
  exists: vi.fn(),
  createReadStream: vi.fn(),
  createWriteStream: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@google-cloud/storage', () => ({
  Storage: vi.fn(() => ({
    bucket: vi.fn(() => ({
      file: vi.fn(() => mockGcsFile),
    })),
  })),
}))

vi.mock('firebase-functions/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  },
  onRequest: (_opts: unknown, handler: unknown) => handler,
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
  })),
}))

vi.mock('./stores/enterpriseBillingSnapshot.js', () => ({
  getBillingSnapshot: vi.fn(),
}))

vi.mock('./stores/enterpriseInvoiceFile.js', () => ({
  getInvoiceFileMeta: vi.fn(),
  setInvoiceFileMeta: vi.fn(),
}))

vi.mock('./stores/enterprise.js', () => ({
  getEnterpriseById: vi.fn(),
}))

vi.mock('./utils/enterpriseAuthHelpers.js', () => ({
  assertEnterpriseAdminFromUid: vi.fn(),
}))

vi.mock('./utils/enterpriseBillInvoiceCors.js', () => ({
  handleEnterpriseBillInvoiceCors: vi.fn().mockResolvedValue('continue'),
}))

vi.mock('./utils/PdfGenerator.js', () => ({
  PdfGenerator: vi.fn(),
}))

vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}))

import { getAuth } from 'firebase-admin/auth'
import { getBillingSnapshot } from './stores/enterpriseBillingSnapshot.js'
import { getInvoiceFileMeta, setInvoiceFileMeta } from './stores/enterpriseInvoiceFile.js'
import { getEnterpriseById } from './stores/enterprise.js'
import { assertEnterpriseAdminFromUid } from './utils/enterpriseAuthHelpers.js'
import { PdfGenerator } from './utils/PdfGenerator.js'
import { createEnterpriseBillInvoice, enterpriseBillInvoice } from './enterpriseBillInvoice.js'

const finalSnapshot = new EnterpriseBillingSnapshot('2026-06', {
  active_account_count: 2,
  unit_price: 500,
  platform_fee_amount: 1000,
  is_trial: false,
  meal_billing_amount: 5000,
  total_billing_amount: 6000,
  billing_status: 'final',
})

type HttpHandler = (
  req: {
    path: string
    query: Record<string, string | undefined>
    headers: Record<string, string | undefined>
  },
  res: {
    status: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
    setHeader: ReturnType<typeof vi.fn>
    headersSent: boolean
  },
) => Promise<void>

const httpHandler = enterpriseBillInvoice as unknown as HttpHandler

describe('createEnterpriseBillInvoice', () => {
  beforeEach(() => {
    vi.mocked(getBillingSnapshot).mockReset()
    vi.mocked(getInvoiceFileMeta).mockReset()
    vi.mocked(setInvoiceFileMeta).mockReset()
    vi.mocked(getEnterpriseById).mockReset()
    vi.mocked(PdfGenerator).mockReset()
    mockGcsFile.exists.mockReset()
    mockGcsFile.createReadStream.mockReset()
    mockGcsFile.createWriteStream.mockReset()
    mockGcsFile.delete.mockReset()
    process.env.GCLOUD_PROJECT = 'test-project'
  })

  it('snapshot なしは failed-precondition', async () => {
    vi.mocked(getBillingSnapshot).mockResolvedValue(undefined)
    await expect(createEnterpriseBillInvoice('ent1', '2026-06')).rejects.toMatchObject({
      code: 'failed-precondition',
    })
  })

  it('provisional は failed-precondition', async () => {
    vi.mocked(getBillingSnapshot).mockResolvedValue(
      new EnterpriseBillingSnapshot('2026-06', { ...finalSnapshot, billing_status: 'provisional' }),
    )
    await expect(createEnterpriseBillInvoice('ent1', '2026-06')).rejects.toMatchObject({
      code: 'failed-precondition',
    })
  })

  it('total 0 は failed-precondition', async () => {
    vi.mocked(getBillingSnapshot).mockResolvedValue(
      new EnterpriseBillingSnapshot('2026-06', { ...finalSnapshot, total_billing_amount: 0 }),
    )
    await expect(createEnterpriseBillInvoice('ent1', '2026-06')).rejects.toMatchObject({
      code: 'failed-precondition',
    })
  })

  it('meta ありは PdfGenerator を呼ばず gcs_id を返す', async () => {
    vi.mocked(getBillingSnapshot).mockResolvedValue(finalSnapshot)
    vi.mocked(getInvoiceFileMeta).mockResolvedValue(new EnterpriseInvoiceFile('2026-06', { gcs_id: 'cached-id' }))
    mockGcsFile.exists.mockResolvedValue([true])

    const invoiceId = await createEnterpriseBillInvoice('ent1', '2026-06')
    expect(invoiceId).toBe('cached-id')
    expect(PdfGenerator).not.toHaveBeenCalled()
    expect(setInvoiceFileMeta).not.toHaveBeenCalled()
  })

  it('meta なしは生成後 setInvoiceFileMeta する', async () => {
    vi.mocked(getBillingSnapshot).mockResolvedValue(finalSnapshot)
    vi.mocked(getInvoiceFileMeta).mockResolvedValue(undefined)
    vi.mocked(getEnterpriseById).mockResolvedValue(new Enterprise('ent1', { company_name: 'Test Co', is_active: true }))
    vi.mocked(setInvoiceFileMeta).mockResolvedValue('created')

    const mockReadable = new Readable({
      read() {
        this.push('pdf-chunk')
        this.push(null)
      },
    })

    const mockWriteStream = new Writable({
      write(_chunk, _encoding, callback) {
        callback()
      },
    })
    mockGcsFile.createWriteStream.mockReturnValue(mockWriteStream)

    vi.mocked(PdfGenerator).mockImplementation(
      () =>
        ({
          executeDocumentMergeForStream: vi.fn().mockResolvedValue(mockReadable),
        }) as unknown as PdfGenerator,
    )

    const invoiceId = await createEnterpriseBillInvoice('ent1', '2026-06')
    expect(invoiceId).toHaveLength(43)
    expect(setInvoiceFileMeta).toHaveBeenCalledWith('ent1', '2026-06', invoiceId)
  })

  it('already_exists かつ別 ID の場合は generated ファイルを削除する', async () => {
    vi.mocked(getBillingSnapshot).mockResolvedValue(finalSnapshot)
    vi.mocked(getInvoiceFileMeta)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(new EnterpriseInvoiceFile('2026-06', { gcs_id: 'existing-id' }))
    vi.mocked(getEnterpriseById).mockResolvedValue(new Enterprise('ent1', { company_name: 'Test Co', is_active: true }))
    vi.mocked(setInvoiceFileMeta).mockResolvedValue('already_exists')
    mockGcsFile.delete.mockResolvedValue(undefined)

    const mockReadable = new Readable({
      read() {
        this.push('pdf-chunk')
        this.push(null)
      },
    })

    const mockWriteStream = new Writable({
      write(_chunk, _encoding, callback) {
        callback()
      },
    })
    mockGcsFile.createWriteStream.mockReturnValue(mockWriteStream)

    vi.mocked(PdfGenerator).mockImplementation(
      () =>
        ({
          executeDocumentMergeForStream: vi.fn().mockResolvedValue(mockReadable),
        }) as unknown as PdfGenerator,
    )

    const invoiceId = await createEnterpriseBillInvoice('ent1', '2026-06')
    expect(invoiceId).toBe('existing-id')
    expect(mockGcsFile.delete).toHaveBeenCalledWith({ ignoreNotFound: true })
  })
})

describe('enterpriseBillInvoice HTTP', () => {
  beforeEach(() => {
    vi.mocked(getAuth).mockReturnValue({
      verifyIdToken: vi.fn(),
    } as unknown as ReturnType<typeof getAuth>)
    vi.mocked(assertEnterpriseAdminFromUid).mockReset()
    vi.mocked(getBillingSnapshot).mockReset()
    vi.mocked(getInvoiceFileMeta).mockReset()
    mockGcsFile.exists.mockReset()
    process.env.GCLOUD_PROJECT = 'test-project'
  })

  it('JWT なしは 401', async () => {
    const status = vi.fn().mockReturnThis()
    const send = vi.fn()
    const setHeader = vi.fn()
    await httpHandler(
      {
        path: '/enterpriseBillInvoice/ent1',
        query: { year_month: '2026-06' },
        headers: {},
      },
      { status, send, setHeader, headersSent: false },
    )
    expect(status).toHaveBeenCalledWith(401)
  })

  it('?id= ありは認証なしで stream', async () => {
    mockGcsFile.exists.mockResolvedValue([true])
    mockGcsFile.createReadStream.mockReturnValue(
      new Writable({
        write(_chunk, _encoding, callback) {
          callback()
        },
      }),
    )

    const status = vi.fn().mockReturnThis()
    const send = vi.fn()
    const setHeader = vi.fn()
    await httpHandler(
      {
        path: '/enterpriseBillInvoice/ent1',
        query: { year_month: '2026-06', id: 'cached-id' },
        headers: {},
      },
      { status, send, setHeader, headersSent: false },
    )
    expect(assertEnterpriseAdminFromUid).not.toHaveBeenCalled()
    expect(setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf')
  })
})
