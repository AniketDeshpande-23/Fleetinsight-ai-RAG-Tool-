import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

DATA_PATH = "data/processed/"
VECTOR_PATH = "vector_store/"

def load_documents():
    documents = []
    for file in os.listdir(DATA_PATH):
        path = os.path.join(DATA_PATH, file)
        if file.endswith(".pdf"):
            documents.extend(PyPDFLoader(path).load())
        elif file.endswith(".txt"):
            documents.extend(TextLoader(path).load())
    return documents

def create_vector_store():
    print("Loading documents...")
    docs = load_documents()

    splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=200
)

    split_docs = splitter.split_documents(docs)

    print("Creating embeddings...")
    embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
       
)

    vectorstore = FAISS.from_documents(split_docs, embeddings)

    print("Saving FAISS index...")
    vectorstore.save_local(VECTOR_PATH)
    print("Done!")

if __name__ == "__main__":
    create_vector_store()
