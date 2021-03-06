// Generated by CoffeeScript 1.6.3
(function() {
  var BigInteger, LinkSequenceBuilder, LinkSequenceDecoder, alphabet, base, bytesToHex, crypto, decimalToHex, decodeBase58, encodeAddress, encodeAddresses, encodeBase58, hashBuffer, hexToBytes, nbi, nbv, opCodes;

  crypto = require("crypto");

  BigInteger = require("jsbn");

  alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  nbi = function() {
    return new BigInteger(null);
  };

  nbv = function(i) {
    var r;
    r = nbi();
    r.fromInt(i);
    return r;
  };

  BigInteger.valueOf = nbv;

  base = BigInteger.valueOf(58);

  BigInteger.fromByteArrayUnsigned = function(ba) {
    if (!ba.length) {
      return ba.valueOf(0);
    } else if (ba[0] & 0x80) {
      return new BigInteger([0].concat(ba));
    } else {
      return new BigInteger(ba);
    }
  };

  BigInteger.prototype.toByteArrayUnsigned = function() {
    var ba;
    ba = this.abs().toByteArray();
    if (ba.length) {
      if (ba[0] === 0) {
        ba = ba.slice(1);
      }
      return ba.map(function(v) {
        if (v < 0) {
          return v + 256;
        } else {
          return v;
        }
      });
    } else {
      return ba;
    }
  };

  hexToBytes = function(hex) {
    var bytes, c;
    bytes = [];
    c = 0;
    while (c < hex.length) {
      bytes.push(parseInt(hex.substr(c, 2), 16));
      c += 2;
    }
    return bytes;
  };

  bytesToHex = function(bytes) {
    var hex, i;
    hex = [];
    i = 0;
    while (i < bytes.length) {
      hex.push((bytes[i] >>> 4).toString(16));
      hex.push((bytes[i] & 0xF).toString(16));
      i++;
    }
    return hex.join("");
  };

  encodeBase58 = function(input) {
    var bi, chars, i, mod;
    bi = BigInteger.fromByteArrayUnsigned(input);
    chars = [];
    while (bi.compareTo(base) >= 0) {
      mod = bi.mod(base);
      chars.unshift(alphabet[mod.intValue()]);
      bi = bi.subtract(mod).divide(base);
    }
    chars.unshift(alphabet[bi.intValue()]);
    i = 0;
    while (i < input.length) {
      if (input[i] === 0x00) {
        chars.unshift(alphabet[0]);
      } else {
        break;
      }
      i++;
    }
    return chars.join("");
  };

  decodeBase58 = function(input) {
    var alphaIndex, bi, bytes, i, leadingZerosNum;
    bi = BigInteger.valueOf(0);
    leadingZerosNum = 0;
    i = input.length - 1;
    while (i >= 0) {
      alphaIndex = alphabet.indexOf(input[i]);
      if (alphaIndex < 0) {
        throw "Invalid character";
      }
      bi = bi.add(BigInteger.valueOf(alphaIndex).multiply(base.pow(input.length - 1 - i)));
      if (input[i] === "1") {
        leadingZerosNum++;
      } else {
        leadingZerosNum = 0;
      }
      i--;
    }
    bytes = bi.toByteArrayUnsigned();
    while (leadingZerosNum-- > 0) {
      bytes.unshift(0);
    }
    return bytes;
  };

  decimalToHex = function(d, padding) {
    var hex;
    hex = Number(d).toString(16);
    padding = (typeof padding === "undefined" || padding === null ? 2 : padding);
    while (hex.length < padding) {
      hex = "0" + hex;
    }
    return hex;
  };

  hashBuffer = function(algo, buffer) {
    var hash;
    hash = crypto.createHash(algo);
    hash.update(buffer);
    return hash.digest();
  };

  encodeAddress = function(buf, version) {
    var fin, padding, twice;
    version = version || 0x00;
    padding = new Buffer(21);
    padding.fill(version);
    buf.copy(padding, 1, 0);
    twice = hashBuffer("sha256", hashBuffer("sha256", padding));
    fin = new Buffer(25);
    padding.copy(fin);
    twice.copy(fin, 21);
    return encodeBase58(hexToBytes(fin.toString("hex")));
  };

  encodeAddresses = function(buf, version) {
    var next, result, x;
    version = version || 0x00;
    result = [];
    x = 0;
    while (x < buf.length) {
      next = buf.slice(x, x + 20);
      result.push(encodeAddress(next, version));
      x = x + 20;
    }
    return result;
  };

  opCodes = {
    startSequenceOpCode: "4c696e6b",
    inlinePayloadOpCode: "01",
    attachmentPayloadOpCode: "02",
    mimeTypeOpCode: "03",
    payloadEncodingOpCode: "04",
    payloadMD5OpCode: "05",
    payloadSHA1OpCode: "06",
    payloadSHA256OpCode: "07",
    nameOpCode: "10",
    descriptionOpCode: "11",
    keywordsOpCode: "12",
    uriOpCode: "13",
    filenameOpCode: "14",
    originalCreationDateOpCode: "15",
    lastModifiedDateOpCode: "16",
    licenseOpCode: "17",
    referencesTransactionOpCode: "F1",
    replacesTransactionOpCode: "F2",
    nextTransactionOpCode: "FF",
    endSequence: "00"
  };

  LinkSequenceBuilder = (function() {
    function LinkSequenceBuilder(version) {
      this.version = version;
    }

    LinkSequenceBuilder.prototype.str = opCodes.startSequenceOpCode;

    LinkSequenceBuilder.prototype.toString = function() {
      return this.str + opCodes.endSequence;
    };

    LinkSequenceBuilder.prototype.addName = function(name) {
      return this.str += this.encodeName(name);
    };

    LinkSequenceBuilder.prototype.addDescription = function(description) {
      return this.str += this.encodeDescription(description);
    };

    LinkSequenceBuilder.prototype.addURI = function(uri) {
      return this.str += this.encodeURI(uri);
    };

    LinkSequenceBuilder.prototype.addFilename = function(filename) {
      return this.str += this.encodeFilename(filename);
    };

    LinkSequenceBuilder.prototype.addMimeType = function(mimeType) {
      return this.str += this.encodeMimeType(mimeType);
    };

    LinkSequenceBuilder.prototype.addKeywords = function(keywords) {
      return this.str += this.encodeKeywords(keywords);
    };

    LinkSequenceBuilder.prototype.addOriginalCreationDate = function(date) {
      return this.str += this.encodeOriginalCreationDate(date);
    };

    LinkSequenceBuilder.prototype.addLastModifiedDate = function(date) {
      return this.str += this.encodeLastModifiedDate(date);
    };

    LinkSequenceBuilder.prototype.addPayloadInline = function(payload) {
      return this.str += this.encodePayloadInline(payload);
    };

    LinkSequenceBuilder.prototype.addPayloadAttachment = function(buf) {
      return this.str += this.encodePayloadAttachment(buf);
    };

    LinkSequenceBuilder.prototype.addPayloadMD5 = function(buf) {
      return this.str += this.encodePayloadMD5Buffer(buf);
    };

    LinkSequenceBuilder.prototype.addPayloadSHA1 = function(buf) {
      return this.str += this.encodePayloadSHA1Buffer(buf);
    };

    LinkSequenceBuilder.prototype.addPayloadSHA256 = function(buf) {
      return this.str += this.encodePayloadSHA256Buffer(buf);
    };

    LinkSequenceBuilder.prototype.addLicense = function(license) {
      return this.str += this.encodeLicense(license);
    };

    LinkSequenceBuilder.prototype.getAddresses = function() {
      return encodeAddresses(new Buffer(this.toString(), "hex"), this.version);
    };

    LinkSequenceBuilder.prototype.encodeBuffer = function(buf) {
      return decimalToHex(buf.length, 4) + buf.toString("hex");
    };

    LinkSequenceBuilder.prototype.encodeString = function(str) {
      return this.encodeBuffer(new Buffer(str));
    };

    LinkSequenceBuilder.prototype.encodePayloadInline = function(str) {
      return opCodes.inlinePayloadOpCode + this.encodeString(str);
    };

    LinkSequenceBuilder.prototype.encodePayloadAttachment = function(buf) {
      return opCodes.attachmentPayloadOpCode + this.encodeBuffer(buf);
    };

    LinkSequenceBuilder.prototype.encodePayloadEncoding = function(str) {
      return opCodes.payloadEncodingOpCode + this.encodeString(str);
    };

    LinkSequenceBuilder.prototype.encodePayloadMD5Buffer = function(buf) {
      return opCodes.payloadMD5OpCode + hashBuffer("md5", buf).toString("hex");
    };

    LinkSequenceBuilder.prototype.encodePayloadSHA1Buffer = function(buf) {
      return opCodes.payloadSHA1OpCode + hashBuffer("sha1", buf).toString("hex");
    };

    LinkSequenceBuilder.prototype.encodePayloadSHA256Buffer = function(buf) {
      return opCodes.payloadSHA256OpCode + hashBuffer("sha256", buf).toString("hex");
    };

    LinkSequenceBuilder.prototype.encodeName = function(str) {
      return opCodes.nameOpCode + this.encodeString(str);
    };

    LinkSequenceBuilder.prototype.encodeDescription = function(str) {
      return opCodes.descriptionOpCode + this.encodeString(str);
    };

    LinkSequenceBuilder.prototype.encodeURI = function(str) {
      return opCodes.uriOpCode + this.encodeString(str);
    };

    LinkSequenceBuilder.prototype.encodeFilename = function(str) {
      return opCodes.filenameOpCode + this.encodeString(str);
    };

    LinkSequenceBuilder.prototype.encodeKeywords = function(str) {
      return opCodes.keywordsOpCode + this.encodeString(str);
    };

    LinkSequenceBuilder.prototype.encodeMimeType = function(str) {
      return opCodes.mimeTypeOpCode + this.encodeString(str);
    };

    LinkSequenceBuilder.prototype.encodeOriginalCreationDate = function(date) {
      return opCodes.originalCreationDateOpCode + decimalToHex(date.getTime(), 12);
    };

    LinkSequenceBuilder.prototype.encodeLastModifiedDate = function(date) {
      return opCodes.lastModifiedDateOpCode + decimalToHex(date.getTime(), 12);
    };

    LinkSequenceBuilder.prototype.encodeLicense = function(license) {
      return opcodes.licenseOpCode + this.encodeString(str);
    };

    return LinkSequenceBuilder;

  })();

  LinkSequenceDecoder = (function() {
    function LinkSequenceDecoder() {}

    LinkSequenceDecoder.prototype.decode = function(addresses) {
      var firstFour, ip, nextOp, op, payload, result, running, sequence, startSequence, x;
      sequence = new Buffer(addresses.length * 20);
      sequence.fill(0x00);
      for (x in addresses) {
        new Buffer(bytesToHex(decodeBase58(addresses[x]).slice(1)), "hex").copy(sequence, x * 20);
      }
      startSequence = new Buffer(4);
      sequence.copy(startSequence);
      firstFour = startSequence.toString("utf-8");
      if (firstFour !== "Link") {
        throw "First 4 bytes were: " + firstFour;
      }
      ip = 4;
      running = true;
      result = {};
      while (running) {
        nextOp = new Buffer(1);
        sequence.copy(nextOp, 0, ip);
        op = nextOp.toString("hex");
        ip++;
        switch (op) {
          case opCodes.inlinePayloadOpCode:
            payload = this.decodeString(sequence, ip);
            ip += payload[0];
            result.payloadInline = payload[1];
            break;
          case opCodes.nameOpCode:
            payload = this.decodeString(sequence, ip);
            ip += payload[0];
            result.name = payload[1];
            break;
          case opCodes.keywordsOpCode:
            payload = this.decodeString(sequence, ip);
            ip += payload[0];
            result.keywords = payload[1];
            break;
          case opCodes.descriptionOpCode:
            payload = this.decodeString(sequence, ip);
            ip += payload[0];
            result.description = payload[1];
            break;
          case opCodes.uriOpCode:
            payload = this.decodeString(sequence, ip);
            ip += payload[0];
            result.URI = payload[1];
            break;
          case opCodes.filenameOpCode:
            payload = this.decodeString(sequence, ip);
            ip += payload[0];
            result.filename = payload[1];
            break;
          case opCodes.attachmentPayloadOpCode:
            payload = this.decodeBuffer(sequence, ip);
            ip += payload[0];
            result.payloadAttachment = payload[1].toString("hex");
            break;
          case opCodes.payloadMD5OpCode:
            payload = this.decodeBytes(sequence, ip, 16);
            ip += payload[0];
            result.payloadMD5 = payload[1].toString("hex");
            break;
          case opCodes.payloadSHA1OpCode:
            payload = this.decodeBytes(sequence, ip, 20);
            ip += payload[0];
            result.payloadSHA1 = payload[1].toString("hex");
            break;
          case opCodes.payloadSHA256OpCode:
            payload = this.decodeBytes(sequence, ip, 32);
            ip += payload[0];
            result.payloadSHA256 = payload[1].toString("hex");
            break;
          case opCodes.originalCreationDateOpCode:
            result.originalCreationDate = this.decodeDate(sequence, ip);
            ip += 6;
            break;
          case opCodes.lastModifiedDateOpCode:
            result.lastModifiedDate = this.decodeDate(sequence, ip);
            ip += 6;
            break;
          case opCodes.licenseOpCode:
            payload = this.decodeString(sequence, ip);
            ip += payload[0];
            result.license = payload[1];
            break;
          case opCodes.endSequence:
            running = false;
        }
      }
      return result;
    };

    LinkSequenceDecoder.prototype.verify = function(result) {
      var errors, h, p;
      errors = [];
      p = result.payloadAttachment || result.payloadInline;
      if (p == null) {
        return;
      }
      if (result.payloadMD5 != null) {
        h = hashBuffer("md5", p);
        if (h.toString("hex") !== result.payloadMD5) {
          errors.push("Expected MD5 was " + result.payloadMD5 + " but the payload MD5 is " + h);
        }
      }
      if (result.payloadSHA1 != null) {
        h = hashBuffer("sha1", p);
        if (h.toString("hex") !== result.payloadSHA1) {
          errors.push("Expected SHA-1 was " + result.payloadSHA1 + " but the payload SHA-1 is " + h);
        }
      }
      if (result.payloadSHA256 != null) {
        h = hashBuffer("sha256", p);
        if (h.toString("hex") !== result.payloadSHA256) {
          errors.push("Expected SHA-256 was " + result.payloadSHA256 + " but the payload SHA-256 is " + h);
        }
      }
      return errors;
    };

    LinkSequenceDecoder.prototype.decodeSize = function(buffer, ip) {
      return parseInt(this.decodeBytes(buffer, ip, 2)[1].toString("hex"), 16);
    };

    LinkSequenceDecoder.prototype.decodeString = function(buffer, ip) {
      var size;
      size = this.decodeSize(buffer, ip);
      return [size + 2, this.decodeBytes(buffer, ip + 2, size)[1].toString("utf-8")];
    };

    LinkSequenceDecoder.prototype.decodeBuffer = function(buffer, ip) {
      var size;
      size = decodeSize(buffer, ip);
      return [size + 2, this.decodeBytes(buffer, ip + 2, size)[1]];
    };

    LinkSequenceDecoder.prototype.decodeBytes = function(buffer, ip, length) {
      var p;
      p = new Buffer(length);
      buffer.copy(p, 0, ip);
      return [length, p];
    };

    LinkSequenceDecoder.prototype.decodeDate = function(buffer, ip) {
      var buf, d;
      buf = new Buffer(6);
      buffer.copy(buf, 0, ip);
      return d = new Date(parseInt(buf.toString("hex"), 16));
    };

    return LinkSequenceDecoder;

  })();

  if (typeof exports !== "undefined" && exports !== null) {
    exports.LinkSequenceBuilder = module.exports.LinkSequenceBuilder = LinkSequenceBuilder;
    exports.LinkSequenceEncoder = module.exports.LinkSequenceDecoder = LinkSequenceDecoder;
    exports.opCodes = module.exports.opCodes = opCodes;
    exports.decodeBase58 = decodeBase58;
    exports.encodeBase58 = encodeBase58;
    exports.bytesToHex = bytesToHex;
    exports.hashBuffer = hashBuffer;
  }

}).call(this);
