declare class NCASignerError extends Error {
    code: string | null;
    constructor(message: string, code?: string | null);
}

interface NCASignerConnectOptions {
    wsUrl?: string;
}

interface NCASignerFileInputOptions {
    id: string;
}

declare class NCASigner {
    static instance: NCASigner | null;
    static fileInputId: string | null;
    static webSocket: WebSocket | null;
    static callback: ((result: any) => void) | null;
    static readonly DEFAULT_WS_URL: string;

    /**
     * Establishes WebSocket connection to NCA Layer
     * @throws {NCASignerError} If connection fails
     */
    static connect(options?: NCASignerConnectOptions): Promise<void>;

    /**
     * Links file input element by ID
     */
    static linkFileInput(options: NCASignerFileInputOptions): void;

    /**
     * Sends request through WebSocket
     * @throws {NCASignerError} If WebSocket is not connected or request fails
     */
    static sendRequest(request: Record<string, any>): Promise<any>;

    /**
     * Gets active tokens
     * @throws {NCASignerError} If request fails
     */
    static getActiveTokens(): Promise<any>;

    /**
     * Creates CAdES signature from base64 data
     * @throws {NCASignerError} If signing fails
     */
    static createCAdESFromBase64(base64Data: string): Promise<string>;

    /**
     * Signs file selected in the linked file input
     * @throws {NCASignerError} If no file input found, no file selected, or signing fails
     */
    static signFile(): Promise<string>;

    /**
     * Downloads signed data as CMS file
     */
    static downloadCMSFile(base64Data: string, filename?: string): void;
}

export { NCASigner, NCASignerError, NCASignerConnectOptions, NCASignerFileInputOptions };
