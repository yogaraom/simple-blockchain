"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
class Transaction {
    constructor(amount, payer, // public key
    payee // public key
    ) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    toString() {
        return JSON.stringify(this);
    }
}
class Wallet {
    constructor() {
        const keypair = crypto.generateKeyPairSync("rsa", {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: "spki",
                format: "pem",
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem",
                //   cipher: 'aes-256-cbc',
                //   passphrase: 'top secret'
            },
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign("SHA256");
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
class Block {
    constructor(previousHash, Transaction, timeStamp = Date.now()) {
        this.previousHash = previousHash;
        this.Transaction = Transaction;
        this.timeStamp = timeStamp;
        this.nonce = Math.round(Math.random() * 9999999999);
    }
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash("SHA256");
        hash.update(str).end();
        return hash.digest("hex");
    }
}
class Chain {
    constructor() {
        this.chain = [new Block("", new Transaction(100, "Genesis", "Yoga"))];
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    addBlock(transaction, senderPublicKey, signature) {
        const verifier = crypto.createVerify("SHA256");
        verifier.update(transaction.toString());
        const isValidTransaction = verifier.verify(senderPublicKey, signature);
        if (isValidTransaction) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
    mine(nonce) {
        let solution = 1;
        console.log(`⛏️..... mining`);
        while (true) {
            const hash = crypto.createHash("MD5");
            hash.update((nonce * solution).toString()).end();
            const attempt = hash.digest("hex");
            if (attempt.substr(0, 4) === `0000`) {
                console.log(`Solved : ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }
}
Chain.instance = new Chain();
const Alice = new Wallet();
const Bob = new Wallet();
const Yoga = new Wallet();
Yoga.sendMoney(50, Alice.publicKey);
Alice.sendMoney(40, Bob.publicKey);
Bob.sendMoney(40, Yoga.publicKey);
console.log(Chain.instance);
