import * as crypto from "crypto";

class Transaction {
  constructor(
    public amount: number,
    public payer: string, // public key
    public payee: string // public key
  ) {}
  toString() {
    return JSON.stringify(this);
  }
}

class Wallet {
  public publicKey: string;
  public privateKey: string;

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

  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
    const sign = crypto.createSign("SHA256");
    sign.update(transaction.toString()).end();

    const signature = sign.sign(this.privateKey);
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }
}

class Block {
  public nonce = Math.round(Math.random() * 9999999999);
  constructor(
    public previousHash: string,
    public Transaction: Transaction,
    public timeStamp = Date.now()
  ) {}

  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash("SHA256");
    hash.update(str).end();
    return hash.digest("hex");
  }
}

class Chain {
  public static instance = new Chain();

  chain: Block[];

  constructor() {
    this.chain = [new Block("", new Transaction(100, "Genesis", "Yoga"))];
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(
    transaction: Transaction,
    senderPublicKey: string,
    signature: Buffer
  ) {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(transaction.toString());

    const isValidTransaction = verifier.verify(senderPublicKey, signature);

    if (isValidTransaction) {
      const newBlock = new Block(this.lastBlock.hash, transaction);
      this.mine(newBlock.nonce);
      this.chain.push(newBlock);
    }
  }
  mine(nonce: number) {
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


const Alice = new Wallet();
const Bob = new Wallet();
const Yoga = new Wallet()

Yoga.sendMoney(50, Alice.publicKey)
Alice.sendMoney(40, Bob.publicKey)
Bob.sendMoney(40, Yoga.publicKey)
console.log(Chain.instance);