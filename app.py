import streamlit as st
from rag_pipeline import load_qa_chain
import json
import pandas as pd

# Page config
st.set_page_config(
    page_title="FleetInsight AI",
    page_icon="🚚",
    layout="wide"
)

# Header
st.markdown("""
# 🚚 FleetInsight AI  
### Logistics Operations Intelligence Assistant
""")

st.divider()

# Load RAG chain
qa_chain = load_qa_chain()

# Sidebar
with st.sidebar:
    st.header("📊 About This System")
    st.write("""
    This AI assistant uses:
    - FAISS Vector Search
    - MiniLM Embeddings
    - Local LLM (Ollama)
    - Enterprise RAG Architecture
    """)
    st.write("Built for logistics & supply chain intelligence.")

# Main Input Section
query = st.text_input("🔎 Ask a logistics question:")

if st.button("Generate Insight"):
    if query:
        with st.spinner("Analyzing operations data..."):
            response = qa_chain.invoke(query)

        st.success("📊 Analysis Complete")
        st.markdown("### 🚚 FleetInsight Analysis")

        response = response.strip()

        # ----------------------------------------------------
        # 1️⃣ Detect if response looks like JSON
        # ----------------------------------------------------
        if response.startswith("{"):

            # Attempt JSON parsing
            try:
                result = json.loads(response)

            except:
                # Try cleaning common formatting issues
                try:
                    cleaned = response.replace("```json", "").replace("```", "")
                    result = json.loads(cleaned)
                except:
                    result = None

            if result:
                title = result.get("title", "Operational Insight")
                summary = result.get("summary", "")
                data_type = result.get("type", "summary")
                data = result.get("data", [])

                st.markdown(f"## {title}")

                if summary:
                    st.info(summary)

                # -----------------------------
                # TABLE RENDERING
                # -----------------------------
                if data_type == "table" and data:
                    df = pd.DataFrame(data)

                    # Clean column names
                    df.columns = [
                        col.replace("_", " ").title() for col in df.columns
                    ]

                    # KPI cards for numeric columns
                    numeric_cols = df.select_dtypes(
                        include=["int64", "float64"]
                    ).columns

                    if len(numeric_cols) > 0:
                        cols = st.columns(len(numeric_cols))
                        for i, col in enumerate(numeric_cols):
                            cols[i].metric(
                                label=col,
                                value=round(df[col].sum(), 2)
                            )

                    st.markdown("### 📋 Detailed Data")
                    st.dataframe(df, use_container_width=True)

                # -----------------------------
                # CHART RENDERING
                # -----------------------------
                elif data_type == "chart" and data:
                    df = pd.DataFrame(data)
                    df.columns = [
                        col.replace("_", " ").title() for col in df.columns
                    ]

                    st.markdown("### 📈 Trend Analysis")

                    numeric_cols = df.select_dtypes(
                        include=["int64", "float64"]
                    ).columns

                    if len(numeric_cols) >= 1:
                        index_col = df.columns[0]
                        df = df.set_index(index_col)

                        if len(numeric_cols) > 1:
                            st.bar_chart(df)
                        else:
                            st.line_chart(df)
                    else:
                        st.dataframe(df, use_container_width=True)

                else:
                    st.markdown("### 🧠 Insight")
                    st.write(summary)

            else:
                # JSON failed completely → fallback to clean text
                st.markdown("### 🧠 Insight")
                st.write(response)

        # ----------------------------------------------------
        # 2️⃣ If NOT JSON → treat as normal text
        # ----------------------------------------------------
        else:
            st.markdown("### 🧠 Insight")
            st.write(response)

st.divider()

# Example questions
st.markdown("### 💡 FAQs:")
st.markdown("""
- Which driver has the highest number of safety incidents?
- What are the most frequent delivery routes?
- Which truck has required the most maintenance?
- Show trends in fuel purchases.
- Which facilities handle the highest trip volume?
""")
