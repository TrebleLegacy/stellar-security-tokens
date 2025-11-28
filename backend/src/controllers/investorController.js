import { Investor } from '../models/Investor.js';
import { StellarService } from '../services/stellar.service.js';
import { PaymentService } from '../services/payment.service.js';
import { PasskeyWalletService, UserType } from '../services/passkeyWallet.service.js';
import { EmailService } from '../services/email.service.js';
import { generateToken } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';

// REMOVED: createInvestor and registerInvestor (traditional flow deprecated)
// All investors must now use passkey registration flow via registerInvestorWithPasskey


/**
 * @deprecated Password authentication removed. Use passkey login at POST /api/auth/passkey-login
 */
export const loginInvestor = async (req, res, next) => {
  return res.status(410).json({
    success: false,
    error: 'Password authentication is no longer supported. Please use passkey login.',
    migrateUrl: '/api/auth/passkey-login',
    message: 'This endpoint has been deprecated. Investors must authenticate using WebAuthn passkeys.',
  });
};

export const whitelistInvestor = async (req, res, next) => {
  try {
    const { investorId } = req.params;
    const { assetCode = 'SIN01' } = req.body;

    const investor = await Investor.findById(parseInt(investorId, 10));
    if (!investor) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found',
      });
    }

    if (!investor.stellarPublicKey) {
      return res.status(400).json({
        success: false,
        error: 'Investor does not have a Stellar public key',
      });
    }

    const result = await StellarService.whitelistInvestor(
      investor.stellarPublicKey,
      assetCode
    );

    const updatedInvestor = await Investor.update(investorId, {
      kycStatus: 'approved',
    });

    res.json({
      success: true,
      message: 'Investor whitelisted successfully',
      data: {
        investor: updatedInvestor,
        stellarTransaction: {
          transactionHash: result.transactionHash,
          ledger: result.ledger,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvestors = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const offset = parseInt(req.query.offset || '0', 10);

    const investors = await Investor.findAll(limit, offset);

    res.json({
      success: true,
      data: investors,
      pagination: {
        limit,
        offset,
        count: investors.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvestorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const investor = await Investor.findById(parseInt(id, 10));

    if (!investor) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: investor.id,
        name: investor.name,
        email: investor.email,
        document: investor.document,
        stellarPublicKey: investor.stellarPublicKey,
        kycStatus: investor.kycStatus,
        lastLogin: investor.lastLogin,
        createdAt: investor.createdAt,
        updatedAt: investor.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvestorBalance = async (req, res, next) => {
  try {
    const { investorId } = req.params;
    const { assetCode = 'SIN01' } = req.query;

    const investor = await Investor.findById(parseInt(investorId, 10));
    if (!investor) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found',
      });
    }

    if (!investor.stellarPublicKey) {
      return res.status(400).json({
        success: false,
        error: 'Investor does not have a Stellar public key',
      });
    }

    const balance = await StellarService.getTokenBalance(
      assetCode,
      investor.stellarPublicKey
    );

    const distributions = await prisma.tokenDistribution.findMany({
      where: {
        investorId: parseInt(investorId, 10),
        assetCode,
      },
      include: {
        token: {
          select: {
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const interestPayments = await prisma.interestPayment.findMany({
      where: {
        investorId: parseInt(investorId, 10),
        assetCode,
      },
      orderBy: [
        { paymentDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: {
        investor: {
          id: investor.id,
          name: investor.name,
          email: investor.email,
          stellarPublicKey: investor.stellarPublicKey,
          kycStatus: investor.kycStatus,
        },
        balance: {
          assetCode: balance.assetCode,
          balance: balance.balance,
          isAuthorized: balance.isAuthorized,
        },
        tokenDistributions: distributions,
        interestPayments,
        summary: {
          totalTokensReceived: distributions.reduce(
            (sum, d) => sum + parseFloat(d.amount),
            0
          ),
          totalInterestReceived: interestPayments.reduce(
            (sum, p) => sum + parseFloat(p.usdcAmount),
            0
          ),
          distributionCount: distributions.length,
          interestPaymentCount: interestPayments.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvestorPayments = async (req, res, next) => {
  try {
    const { investorId } = req.params;
    const { assetCode, limit = 100, offset = 0 } = req.query;

    const investor = await Investor.findById(parseInt(investorId, 10));
    if (!investor) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found',
      });
    }

    const where = { investorId: parseInt(investorId, 10) };
    if (assetCode) where.assetCode = assetCode;

    const [payments, total] = await Promise.all([
      prisma.interestPayment.findMany({
        where,
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
        orderBy: [
          { paymentDate: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.interestPayment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        investor: {
          id: investor.id,
          name: investor.name,
          email: investor.email,
        },
        payments,
        pagination: {
          total,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
          count: payments.length,
        },
        summary: {
          totalInterestReceived: payments.reduce(
            (sum, p) => sum + parseFloat(p.usdcAmount || 0),
            0
          ),
          totalPayments: total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvestor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const investor = await Investor.findById(parseInt(id, 10));
    if (!investor) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found',
      });
    }

    if (updateData.email) {
      const existingEmail = await Investor.findByEmail(updateData.email);
      if (existingEmail && existingEmail.id !== parseInt(id, 10)) {
        return res.status(409).json({
          success: false,
          error: 'Investor with this email already exists',
        });
      }
    }

    const updatedInvestor = await Investor.update(id, updateData);

    res.json({
      success: true,
      data: updatedInvestor,
    });
  } catch (error) {
    next(error);
  }
};

export const getInvestorPortfolio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const investorId = parseInt(id, 10);

    const investor = await Investor.findById(investorId);
    if (!investor) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found',
      });
    }

    const portfolio = await Investor.getPortfolio(investorId);

    res.json({
      success: true,
      data: {
        investor: {
          id: investor.id,
          name: investor.name,
          email: investor.email,
        },
        portfolio,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvestorMetrics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const investorId = parseInt(id, 10);

    const investor = await Investor.findById(investorId);
    if (!investor) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found',
      });
    }

    const metrics = await Investor.getConsolidatedMetrics(investorId);

    res.json({
      success: true,
      data: {
        investor: {
          id: investor.id,
          name: investor.name,
          email: investor.email,
        },
        metrics,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PASSKEY WALLET REGISTRATION FLOW
// ============================================================================

/**
 * Register investor with email verification (Step 1 of Passkey Wallet flow)
 * Does NOT create Stellar account - that happens after email verification
 */
export const registerInvestorWithPasskey = async (req, res, next) => {
  try {
    const { name, email, document } = req.body;

    // Validate required fields
    if (!name || !email || !document) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and document are required',
      });
    }

    // Check for existing investor
    const existingInvestor = await Investor.findByEmail(email);
    if (existingInvestor) {
      return res.status(409).json({
        success: false,
        error: 'Investor with this email already exists',
      });
    }

    // Check for existing document
    const existingDocument = await Investor.findByDocument(document);
    if (existingDocument) {
      return res.status(409).json({
        success: false,
        error: 'Investor with this document already exists',
      });
    }

    // Check for existing temp registration
    const existingTemp = await prisma.tempRegistration.findFirst({
      where: {
        OR: [
          { email },
          { document }
        ]
      }
    });

    if (existingTemp) {
      return res.status(409).json({
        success: false,
        error: 'Registration already in progress for this email or document',
      });
    }

    // Generate verification token
    const verificationToken = EmailService.generateVerificationToken();
    const verificationExpiry = EmailService.getVerificationExpiry();

    // Create temp registration (expires in 24h)
    const tempReg = await prisma.tempRegistration.create({
      data: {
        email,
        name,
        document,
        userType: 'investor',
        emailVerified: false,
        verificationToken,
        verificationExpiry,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    await EmailService.sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Please check your email to verify your account.',
      data: {
        tempId: tempReg.id,
        email: tempReg.email,
        emailVerified: false,
        nextStep: 'verify_email',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email address (Step 2 of Passkey Wallet flow)
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required',
      });
    }

    // Find temp registration by token
    const tempReg = await prisma.tempRegistration.findFirst({
      where: {
        verificationToken: token,
        userType: 'investor',
      },
    });

    if (!tempReg) {
      return res.status(404).json({
        success: false,
        error: 'Invalid verification token',
      });
    }

    // Check expiry
    if (tempReg.verificationExpiry && tempReg.verificationExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Verification token has expired',
      });
    }

    // Mark as verified
    const updated = await prisma.tempRegistration.update({
      where: { id: tempReg.id },
      data: {
        emailVerified: true,
        verificationToken: null, // Clear token after use
      },
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        tempId: updated.id,
        email: updated.email,
        emailVerified: true,
        nextStep: 'create_wallet',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const investor = await prisma.investor.findUnique({
      where: { email },
    });

    if (!investor) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found',
      });
    }

    if (investor.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified',
      });
    }

    // Generate new verification token
    const verificationToken = EmailService.generateVerificationToken();
    const verificationExpiry = EmailService.getVerificationExpiry();

    // Update investor with new token
    await prisma.investor.update({
      where: { id: investor.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    // Send verification email
    await EmailService.sendVerificationEmail(email, investor.name, verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create smart wallet after passkey registration (Step 3 of Passkey Wallet flow)
 * Called by frontend after WebAuthn credential is created
 */
export const createSmartWallet = async (req, res, next) => {
  try {
    const { tempId, credentialId, publicKey } = req.body;

    if (!tempId || !credentialId || !publicKey) {
      return res.status(400).json({
        success: false,
        error: 'tempId, credentialId, and publicKey are required',
      });
    }

    // Get temp registration
    const tempReg = await prisma.tempRegistration.findUnique({
      where: { id: parseInt(tempId, 10) },
    });

    if (!tempReg) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found or expired',
      });
    }

    if (!tempReg.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email must be verified before creating wallet',
      });
    }

    // Convert publicKey from base64 to Buffer if needed
    const publicKeyBuffer = Buffer.isBuffer(publicKey)
      ? publicKey
      : Buffer.from(publicKey, 'base64');

    // Create smart wallet contract
    const server = PasskeyWalletService.getServer();
    const walletResult = await server.createWallet(credentialId, publicKeyBuffer);

    if (!walletResult || !walletResult.contractId) {
      throw new Error('Failed to deploy smart wallet contract');
    }

    // Create investor with ALL required passkey fields
    const investor = await prisma.investor.create({
      data: {
        name: tempReg.name,
        email: tempReg.email,
        document: tempReg.document,
        stellarContractId: walletResult.contractId,
        passkeyCredentialId: credentialId,
        passkeyPublicKey: publicKeyBuffer,
        kycStatus: 'pending',
        emailVerified: true,
      },
    });

    // Delete temp registration (cleanup)
    await prisma.tempRegistration.delete({
      where: { id: tempReg.id },
    });

    // Send welcome email
    await EmailService.sendWelcomeEmail(
      investor.email,
      investor.name,
      investor.stellarContractId
    );

    // Generate JWT token for immediate login
    const token = generateToken({
      userId: investor.id,
      email: investor.email,
      userType: 'investor',
    });

    res.status(201).json({
      success: true,
      message: 'Smart wallet created successfully',
      data: {
        token,
        investor: {
          id: investor.id,
          name: investor.name,
          email: investor.email,
          stellarContractId: investor.stellarContractId,
          kycStatus: investor.kycStatus,
        },
        nextStep: 'complete_kyc',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wallet creation status for an investor
 */
export const getWalletStatus = async (req, res, next) => {
  try {
    const { investorId } = req.params;

    const status = await PasskeyWalletService.getWalletStatus(
      UserType.INVESTOR,
      parseInt(investorId, 10)
    );

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get passkey kit client configuration
 */
export const getPasskeyConfig = async (req, res, next) => {
  try {
    const config = PasskeyWalletService.getClientConfig();

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};
