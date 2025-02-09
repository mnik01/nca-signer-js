require('../signer.js'); // Ensure window.NCASigner is available

// Mock WebSocket
global.WebSocket = class {
    constructor(url) {
        this.url = url;
        this.readyState = WebSocket.CONNECTING; // Simulate connecting state
        this.onopen = null;
        this.onerror = null;
        this.onmessage = null;

        // Simulate WebSocket opening after a short delay
        setTimeout(() => {
            this.readyState = WebSocket.OPEN; // Ensure readyState is OPEN
            if (this.onopen) this.onopen();
        }, 10);
    }

    send(data) {
        setTimeout(() => {
            if (this.onmessage) {
                this.onmessage({ data: JSON.stringify({ code: "200", responseObject: "mock_response" }) });
            }
        }, 10);
    }

    close() {
        this.readyState = WebSocket.CLOSED; // CLOSED state
    }
};

// Mock implementations
const mockFileReader = {
    readAsDataURL: function(blob) {
      setTimeout(() => {
        this.onload({ target: { result: 'data:application/pdf;base64,bW9ja19iYXNlNjRfZGF0YQ==' } });
      }, 10);
    }
  };
  
  const mockDocument = {
    createElement: jest.fn((elementType) => ({
      click: jest.fn(),
      href: '',
      download: ''
    })),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    },
    getElementById: jest.fn()
  };
  
  describe('NCASigner Class', () => {
    beforeEach(() => {
      // Reset globals and mocks before each test
      global.window = global;
      global.document = mockDocument;
      global.FileReader = jest.fn(() => mockFileReader);
      global.Blob = jest.fn();
      global.URL.createObjectURL = jest.fn();
      global.atob = jest.fn(str => str);
      
      // Reset NCASigner static properties
      window.NCASigner.webSocket = null;
      window.NCASigner.callback = null;
      window.NCASigner.fileInputId = null;
  
      // Reset all mocks
      jest.clearAllMocks();
    });
  
    describe('Connection Management', () => {
      test('should connect with custom WebSocket URL', async () => {
        const customUrl = 'wss://custom.example.com:13579/';
        await window.NCASigner.connect({ wsUrl: customUrl });
        expect(window.NCASigner.webSocket.url).toBe(customUrl);
      });
  
      test('should throw error on connection failure', async () => {
        // Override WebSocket to simulate failure
        const originalWebSocket = global.WebSocket;
        global.WebSocket = class {
          constructor() {
            setTimeout(() => {
              if (this.onerror) this.onerror(new Error('Connection failed'));
            }, 10);
          }
        };
  
        await expect(window.NCASigner.connect())
          .rejects
          .toThrow('WebSocket connection failed');
  
        global.WebSocket = originalWebSocket;
      });
    });
  
    describe('Request Handling', () => {
      test('should handle failed requests', async () => {
        await window.NCASigner.connect();
        
        // Wait for connection to be established
        await new Promise(resolve => setTimeout(resolve, 20));
  
        // Override the callback mechanism to simulate error
        const originalSend = window.NCASigner.webSocket.send;
        window.NCASigner.webSocket.send = function(data) {
          setTimeout(() => {
            if (window.NCASigner.callback) {
              window.NCASigner.callback({
                code: "500",
                message: "Operation failed"
              });
            }
          }, 10);
        };
  
        await expect(window.NCASigner.getActiveTokens())
          .rejects
          .toThrow('Operation failed');
  
        window.NCASigner.webSocket.send = originalSend;
      });
  
      test('should throw error when sending request without connection', async () => {
        await expect(window.NCASigner.sendRequest({}))
          .rejects
          .toThrow('WebSocket connection not established');
      });
    });
  
    describe('File Operations', () => {
      test('should handle file input linking', () => {
        window.NCASigner.linkFileInput({ id: 'testFileInput' });
        expect(window.NCASigner.fileInputId).toBe('testFileInput');
      });
  
      test('should throw error when signing without linked input', async () => {
        await expect(window.NCASigner.signFile())
          .rejects
          .toThrow('File input not linked');
      });
  
      test('should throw error when file input not found', async () => {
        window.NCASigner.linkFileInput({ id: 'nonexistentInput' });
        document.getElementById.mockImplementation(() => null);
  
        await expect(window.NCASigner.signFile())
          .rejects
          .toThrow('File input with id "nonexistentInput" not found');
      });
  
      test('should throw error when no file selected', async () => {
        window.NCASigner.linkFileInput({ id: 'testFileInput' });
        document.getElementById.mockImplementation(() => ({ files: [] }));
  
        await expect(window.NCASigner.signFile())
          .rejects
          .toThrow('No file selected');
      });
  
      test('should successfully sign file', async () => {
        // Setup
        await window.NCASigner.connect();
        
        // Wait for connection to be established
        await new Promise(resolve => setTimeout(resolve, 20));
        
        window.NCASigner.linkFileInput({ id: 'testFileInput' });
        document.getElementById.mockImplementation(() => ({
          files: [new Blob(['test'])]
        }));
  
        const result = await window.NCASigner.signFile();
        expect(result).toBe('mock_response');
      });
    });
  
    describe('CMS File Download', () => {
      test('should create and trigger download of CMS file', () => {
        const mockLink = {
          click: jest.fn(),
          href: '',
          download: ''
        };
        document.createElement.mockReturnValue(mockLink);
        
        const base64Data = 'test_base64_data';
        window.NCASigner.downloadCMSFile(base64Data, 'test.cms');
  
        expect(global.Blob).toHaveBeenCalled();
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.download).toBe('test.cms');
      });
    });
  
    describe('CAdES Operations', () => {
      test('should create CAdES signature from base64 data', async () => {
        await window.NCASigner.connect();
        
        // Wait for connection to be established
        await new Promise(resolve => setTimeout(resolve, 20));
        
        const base64Data = 'test_base64_data';
        const result = await window.NCASigner.createCAdESFromBase64(base64Data);
        expect(result).toBe('mock_response');
      });
    });
  });