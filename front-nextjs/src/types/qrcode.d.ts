declare module 'qrcode' {
	interface QRCodeToDataURLOptions {
		width?: number
		margin?: number
		errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
		color?: {
			dark?: string
			light?: string
		}
	}

	interface QRCodeModule {
		toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>
	}

	const QRCode: QRCodeModule

	export default QRCode
}
