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

# Chat history initialization
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages from history on app rerun
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        if message["role"] == "user":
            st.markdown(message["content"])
        else:
            # Display assistant messages (which could be text or parsed JSON)
            result = message.get("result")
            if result:
                title = result.get("title", "Operational Insight")
                summary = result.get("summary", "")
                data_type = result.get("type", "summary")
                data = result.get("data", [])

                st.markdown(f"### {title}")
                if summary:
                    st.info(summary)
                
                # Table rendering
                if data_type == "table" and data:
                    df = pd.DataFrame(data)
                    df.columns = [str(col).replace("_", " ").title() for col in df.columns]
                    st.dataframe(df, use_container_width=True)
                
                # Chart rendering
                elif data_type == "chart" and data:
                    df = pd.DataFrame(data)
                    numeric_cols = df.select_dtypes(include=["int64", "float64"]).columns
                    if len(numeric_cols) >= 1:
                        index_col = df.columns[0]
                        df = df.set_index(index_col)
                        st.bar_chart(df)
                    else:
                        st.dataframe(df, use_container_width=True)
            else:
                st.markdown(message["content"])

# Main Input Section
if query := st.chat_input("🔎 Ask a logistics question:"):
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": query})
    with st.chat_message("user"):
        st.markdown(query)

    with st.chat_message("assistant"):
        with st.spinner("Analyzing operations data..."):
            try:
                # Invoke RAG chain, which returns a dict thanks to JsonOutputParser
                result = qa_chain.invoke(query)
                
                # Render it
                title = result.get("title", "Operational Insight")
                summary = result.get("summary", "")
                data_type = result.get("type", "summary")
                data = result.get("data", [])

                st.markdown(f"### {title}")
                if summary:
                    st.info(summary)

                # Table rendering
                if data_type == "table" and data:
                    df = pd.DataFrame(data)
                    df.columns = [str(col).replace("_", " ").title() for col in df.columns]
                    st.dataframe(df, use_container_width=True)
                
                # Chart rendering
                elif data_type == "chart" and data:
                    df = pd.DataFrame(data)
                    numeric_cols = df.select_dtypes(include=["int64", "float64"]).columns
                    if len(numeric_cols) >= 1:
                        index_col = df.columns[0]
                        df = df.set_index(index_col)
                        st.bar_chart(df)
                    else:
                        st.dataframe(df, use_container_width=True)
                
                st.session_state.messages.append({"role": "assistant", "content": summary, "result": result})

            except Exception as e:
                error_msg = f"Sorry, I couldn't process that structure. Try rephrasing your question."
                st.error(error_msg)
                st.session_state.messages.append({"role": "assistant", "content": error_msg, "result": None})

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
