import { createQR, encodeURL, findReference, FindReferenceError, TransferRequestURLFields, validateTransfer, ValidateTransferError } from "@solana/pay";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef } from "react";
import BackLink from "../../components/BackLink";
import PageHeading from "../../components/PageHeading";
import { shopAddress } from "../../lib/addresses";
import calculatePrice from "../../lib/calculatePrice";

export default function Checkout() {
  const router = useRouter()

  // ref to a div where we'll show the QR code
  const qrRef = useRef<HTMLDivElement>(null)

  const amount = useMemo(() => calculatePrice(router.query), [router.query])

  // Unique address that we can listen for payments to
  const reference = useMemo(() => Keypair.generate().publicKey, [])

  // Solana Pay transfer params
  const urlParams: TransferRequestURLFields = {
    recipient: shopAddress,
    // splToken: shopAddress,
    amount,
    reference,
    label: "Cookies Inc",
    message: "Thanks for your order! 🍪",
  }

  // Encode the params into the format shown
  const url = encodeURL(urlParams)
  console.log({ url })

  // Show the QR code
  useEffect(() => {
    const qr = createQR(url, 512, 'transparent')
    if (qrRef.current && amount.isGreaterThan(0)) {
      qrRef.current.innerHTML = ''
      qr.append(qrRef.current)
    }
  })
  const network = WalletAdapterNetwork.Devnet
const endpoint = clusterApiUrl(network)
const connection = new Connection(endpoint)
  useEffect(() => {
    // Get a connection to Solana devnet

    const interval = setInterval(async () => {
      try {
        // Check if there is any transaction for the reference
        const signatureInfo = await findReference(connection, reference, { finality: 'confirmed' })
        // Validate that the transaction has the expected recipient, amount and SPL token
        // await validateTransactionSignature(connection, signatureInfo.signature, shopAddress, amount, undefined, reference, 'c')
        await validateTransfer(
          connection,
          signatureInfo.signature,
          {
            recipient: shopAddress,
            amount,
            // splToken: usdcAddress,
            splToken: undefined,
            reference,
          },
          { commitment: 'confirmed' }
        )
        router.push('/shop/confirmed')
      } catch (e) {
        if (e instanceof FindReferenceError) {
          // No transaction found yet, ignore this error
          return;
        }
        if (e instanceof ValidateTransferError) {
          // Transaction is invalid
          console.error('Transaction is invalid', e)
          return;
        }
        console.error('Unknown error', e)
      }
    }, 500)
    return () => {
      clearInterval(interval)
    }
  }, [amount])
  return (
    <div className="flex flex-col items-center gap-8">
      <BackLink href='/shop'>Cancel</BackLink>

      <PageHeading>Checkout ${amount.toString()}</PageHeading>

      {/* div added to display the QR code */}
      <div ref={qrRef} />
    </div>
  )
}

function validateTransactionSignature() {
    throw new Error("Function not implemented.");
}
