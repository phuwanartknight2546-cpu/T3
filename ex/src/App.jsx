import React, { useState, useEffect } from "react";
import { db, storage } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function App() {
  const [mode, setMode] = useState("menu");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [beforeImg, setBeforeImg] = useState(null);
  const [afterImg, setAfterImg] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const reportsRef = collection(db, "cleanReports");

  const handleSave = async () => {
    try {
      setLoading(true);

      const uploadImage = async (file) => {
        if (!file) return null;
        const storageRef = ref(storage, `images/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
      };

      const beforeUrl = await uploadImage(beforeImg);
      const afterUrl = await uploadImage(afterImg);

      await addDoc(reportsRef, {
        before,
        after,
        beforeUrl,
        afterUrl,
        createdAt: serverTimestamp(),
      });

      alert("✅ บันทึกสำเร็จ!");
      setMode("menu");
    } catch (error) {
      console.error(error);
      alert("❌ เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    const q = query(reportsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    if (mode === "view") {
      loadReports();
    }
  }, [mode]);

  if (mode === "menu") {
    return (
      <div style={{ padding: 20 }}>
        <h2>📋 ระบบรายงานการทำความสะอาดห้องน้ำ</h2>
        <button onClick={() => setMode("add")}>➕ เพิ่มข้อมูล</button>
        <button onClick={() => setMode("view")}>📖 ดูรายงาน</button>
      </div>
    );
  }

  if (mode === "add") {
    return (
      <div style={{ padding: 20 }}>
        <h3>เพิ่มข้อมูลการทำความสะอาด</h3>
        <p>📅 วันที่: {new Date().toLocaleDateString()}</p>
        <div>
          <label>ก่อนทำ: </label>
          <input value={before} onChange={(e) => setBefore(e.target.value)} />
          <input type="file" onChange={(e) => setBeforeImg(e.target.files[0])} />
        </div>
        <div>
          <label>หลังทำ: </label>
          <input value={after} onChange={(e) => setAfter(e.target.value)} />
          <input type="file" onChange={(e) => setAfterImg(e.target.files[0])} />
        </div>
        <button onClick={handleSave} disabled={loading}>
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button onClick={() => setMode("menu")}>⬅️ กลับ</button>
      </div>
    );
  }

  if (mode === "view") {
    return (
      <div style={{ padding: 20 }}>
        <h3>รายงานทั้งหมด</h3>
        <button onClick={() => setMode("menu")}>⬅️ กลับ</button>
        <ul>
          {reports.map((r) => (
            <li key={r.id} style={{ marginBottom: 20 }}>
              <p>📅 {r.createdAt?.toDate().toLocaleString() || "-"}</p>
              <p>ก่อนทำ: {r.before}</p>
              {r.beforeUrl && <img src={r.beforeUrl} width="200" />}
              <p>หลังทำ: {r.after}</p>
              {r.afterUrl && <img src={r.afterUrl} width="200" />}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}
