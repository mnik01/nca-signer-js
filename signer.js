/**
 * @class NCASignerError
 * @extends Error
 * Custom error class for NCA Signer specific errors
 */
class NCASignerError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} [code] - Error code if available
   */
  constructor(message, code = null) {
      super(message);
      this.name = 'NCASignerError';
      this.code = code;
  }
}

/**
* @class NCASigner
* Main class for handling NCA Layer signing operations
*/
class NCASigner {
  static instance = null;
  static fileInputId = null;
  static webSocket = null;
  static callback = null;
  static DEFAULT_WS_URL = 'wss://127.0.0.1:13579/';

  /**
   * Establishes WebSocket connection to NCA Layer
   * @param {Object} [options] - Connection options
   * @param {string} [options.wsUrl] - WebSocket URL
   * @throws {NCASignerError} If connection fails
   * @returns {Promise<void>}
   */
  static async connect({ wsUrl = NCASigner.DEFAULT_WS_URL } = {}) {
      return new Promise((resolve, reject) => {
          try {
              NCASigner.webSocket = new WebSocket(wsUrl);
              
              NCASigner.webSocket.onmessage = function(event) {
                  let result = JSON.parse(event.data);
                  if (NCASigner.callback) {
                      NCASigner.callback(result);
                      NCASigner.callback = null;
                  }
              };

              NCASigner.webSocket.onopen = () => {
                  resolve();
              };

              NCASigner.webSocket.onerror = (error) => {
                  reject(new NCASignerError('WebSocket connection failed', 'CONNECTION_ERROR'));
              };
          } catch (error) {
              reject(new NCASignerError('Failed to initialize WebSocket', 'INIT_ERROR'));
          }
      });
  }

  /**
   * Links file input element by ID
   * @param {Object} options - Configuration options
   * @param {string} options.id - File input element ID
   */
  static linkFileInput({ id }) {
      NCASigner.fileInputId = id;
  }

  /**
   * Sends request through WebSocket
   * @param {Object} request - Request object to send
   * @throws {NCASignerError} If WebSocket is not connected or request fails
   * @returns {Promise<any>}
   */
  static sendRequest(request) {
      return new Promise((resolve, reject) => {
          if (!NCASigner.webSocket || NCASigner.webSocket.readyState !== WebSocket.OPEN) {
              reject(new NCASignerError('WebSocket connection not established', 'NO_CONNECTION'));
              return;
          }

          NCASigner.callback = (result) => {
              if (result.code === "200") {
                  resolve(result.responseObject);
              } else {
                  reject(new NCASignerError(result.message || 'Operation failed', result.code));
              }
          };

          NCASigner.webSocket.send(JSON.stringify(request));
      });
  }

  /**
   * Gets active tokens
   * @throws {NCASignerError} If request fails
   * @returns {Promise<any>}
   */
  static async getActiveTokens() {
      const request = {
          "module": "kz.gov.pki.knca.commonUtils",
          "method": "getActiveTokens"
      };
      return await NCASigner.sendRequest(request);
  }

  /**
   * Creates CAdES signature from base64 data
   * @param {string} base64Data - Base64 encoded data to sign
   * @throws {NCASignerError} If signing fails
   * @returns {Promise<string>}
   */
  static async createCAdESFromBase64(base64Data) {
      const request = {
          "module": "kz.gov.pki.knca.commonUtils",
          "method": "createCAdESFromBase64",
          "args": ["PKCS12", "SIGNATURE", base64Data, true]
      };
      return await NCASigner.sendRequest(request);
  }

  /**
   * Signs file selected in the linked file input
   * @throws {NCASignerError} If no file input found, no file selected, or signing fails
   * @returns {Promise<string>} Base64 encoded signed data
   */
  static async signFile() {
      if (!NCASigner.fileInputId) {
          throw new NCASignerError('File input not linked', 'NO_INPUT_LINKED');
      }

      const fileInput = document.getElementById(NCASigner.fileInputId);
      if (!fileInput) {
          throw new NCASignerError(`File input with id "${NCASigner.fileInputId}" not found`, 'INPUT_NOT_FOUND');
      }

      if (fileInput.files.length === 0) {
          throw new NCASignerError('No file selected', 'NO_FILE');
      }

      const file = fileInput.files[0];
      const base64String = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              const base64 = e.target.result.split(',')[1];
              resolve(base64);
          };
          reader.onerror = () => reject(new NCASignerError('File reading failed', 'FILE_READ_ERROR'));
          reader.readAsDataURL(file);
      });

      return await NCASigner.createCAdESFromBase64(base64String);
  }

  /**
   * Downloads signed data as CMS file
   * @param {string} base64Data - Base64 encoded signed data
   * @param {string} [filename="signed_file.cms"] - Output filename
   */
  static downloadCMSFile(base64Data, filename = "signed_file.cms") {
      const binary = atob(base64Data);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
      }
      
      const blob = new Blob([array], { type: 'application/pkcs7-mime' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }
}

// Make NCASigner available globally
window.NCASigner = NCASigner;
