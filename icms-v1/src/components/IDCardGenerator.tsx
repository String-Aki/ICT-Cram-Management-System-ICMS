"use client";

import { useEffect, useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PDFImage,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import QRCode from "qrcode";

const styles = StyleSheet.create({
  page: {
    width: "85.6mm",
    height: "54mm",
    backgroundColor: "#ffffff",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftColumn: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 4,
  },
  value: {
    fontSize: 12,
    color: "#1f2937",
    fontWeight: "bold",
  },
  qrContainer: {
    width: 65,
    height: 65,
  },
});

const IDCardDocument = ({
  studentName,
  studentId,
  qrDataUrl,
}: {
  studentName: string;
  studentId: string;
  qrDataUrl: string;
}) => (
  <Document>
    <Page size={[242.64, 153.07]} style={styles.page}>
      <View style={styles.leftColumn}>
        <Text style={styles.title}>ITMS Tuition</Text>
        <Text style={styles.label}>STUDENT NAME</Text>
        <Text style={styles.value}>{studentName}</Text>
        <Text style={styles.label}>STUDENT ID</Text>
        <Text style={styles.value}>
          {studentId.substring(0, 8).toUpperCase()}
        </Text>
      </View>
      <View>
        <PDFImage src={qrDataUrl} style={styles.qrContainer} />
      </View>
    </Page>
  </Document>
);

export default function IDCardGenerator({
  studentName,
  studentId,
}: {
  studentName: string;
  studentId: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(studentId, { margin: 1 });
        setQrDataUrl(url);
      } catch (err) {
        console.error("Failed to generate QR", err);
      }
    };
    generateQR();
  }, [studentId]);

  if (!qrDataUrl)
    return <p className="text-sm text-gray-500">Preparing ID Card...</p>;

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm flex flex-col items-center max-w-xs">
      <h3 className="font-bold mb-2">Generate ID Card</h3>
      <p className="text-sm text-gray-600 mb-4">{studentName}</p>

      <PDFDownloadLink
        document={
          <IDCardDocument
            studentName={studentName}
            studentId={studentId}
            qrDataUrl={qrDataUrl}
          />
        }
        fileName={`${studentName.replace(/\s+/g, "_")}_ID_Card.pdf`}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-semibold"
      >
        {({ loading }) => (loading ? "Generating PDF..." : "Download PDF")}
      </PDFDownloadLink>
    </div>
  );
}
