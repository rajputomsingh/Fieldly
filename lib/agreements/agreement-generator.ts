import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { AgreementSnapshot } from "./agreement.types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function generateLeaseAgreementPdf(
  snapshot: AgreementSnapshot,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const page = pdf.addPage([595, 842]);

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const { width } = page.getSize();

  let y = 790;

  const text = (
    value: string,
    size = 10,
    font = regular,
  ): void => {
    page.drawText(value, {
      x: 50,
      y,
      size,
      font,
      color: rgb(0, 0, 0),
    });

    y -= size + 9;
  };

  text("FIELDLY", 20, bold);

  y -= 10;

  text("DIGITAL FARMLAND LEASE AGREEMENT", 15, bold);

  y -= 15;

  text(`Agreement Version: ${snapshot.agreementVersion}`);
  text(`Template Version: ${snapshot.templateVersion}`);
  text(`Generated: ${formatDate(snapshot.generatedAt)}`);

  y -= 15;

  text("1. PARTIES", 12, bold);
  text(`Farmer: ${snapshot.farmer.name ?? "N/A"}`);
  text(`Farmer Email: ${snapshot.farmer.email ?? "N/A"}`);
  text(`Landowner: ${snapshot.owner.name ?? "N/A"}`);
  text(`Landowner Email: ${snapshot.owner.email ?? "N/A"}`);

  y -= 10;

  text("2. LAND", 12, bold);
  text(`Land: ${snapshot.land.title}`);
  text(`Land ID: ${snapshot.land.id}`);

  y -= 10;

  text("3. COMMERCIAL TERMS", 12, bold);

  text(`Monthly Rent: INR ${snapshot.financials.rent}`);

  text(
    `Security Deposit: INR ${
      snapshot.financials.securityDeposit ?? "0.00"
    }`,
  );

  text(
    `Gross Contract Value: INR ${
      snapshot.financials.grossContractValue ?? "0.00"
    }`,
  );

  text(
    `Platform Fee: INR ${
      snapshot.financials.platformFee ?? "0.00"
    }`,
  );

  text(
    `Owner Receivable: INR ${
      snapshot.financials.netOwnerReceivable ?? "0.00"
    }`,
  );

  y -= 10;

  text("4. LEASE TERM", 12, bold);
  text(`Start Date: ${formatDate(snapshot.dates.startDate)}`);
  text(`End Date: ${formatDate(snapshot.dates.endDate)}`);

  y -= 10;

  text("5. DIGITAL RECORD", 12, bold);
  text("This document represents the generated digital");
  text("lease record stored by the Fieldly platform.");
  text("The agreement is versioned and cryptographically");
  text("hashed when stored by the platform.");

  y -= 20;

  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  y -= 30;

  text("SIGNATURES", 12, bold);
  text("Farmer Signature: __________________________");

  y -= 20;

  text("Landowner Signature: _______________________");

  y -= 30;

  text(`Agreement ID: ${snapshot.leaseId}`, 8);

  return pdf.save();
}
