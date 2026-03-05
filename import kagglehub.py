import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

data = pd.read_csv('customer_segmentation.csv')
print(data.head())

# Check for missing values
print(data.isnull().sum())
# Encode categorical variable (if Gender is categorical)
data['Gender'] = data['Gender'].map({'Male': 0, 'Female': 1})
# Selecting relevant features
features = data[['Age', 'AnnualIncome', 'SpendingScore']]
# Standardizing the data
scaler = StandardScaler()
scaled_features = scaler.fit_transform(features)


# Using the elbow method
inertia = []
for i in range(1, 11):
    kmeans = KMeans(n_clusters=i, random_state=42)
    kmeans.fit(scaled_features)
inertia.append(kmeans.inertia_)
# Plotting the elbow graph
plt.figure(figsize=(8, 5))
plt.plot(range(1, 11), inertia, marker='o')
plt.title('Elbow Method')
plt.xlabel('Number of Clusters')
plt.ylabel('Inertia')
plt.show()
# Fit the K-Means model with the optimal number of clusters
optimal_clusters = 3 # replace with the number determined from the elbow graph
kmeans = KMeans(n_clusters=optimal_clusters, random_state=42)
kmeans.fit(scaled_features)
data['Cluster'] = kmeans.labels_

plt.figure(figsize=(10, 6))
sns.scatterplot(
x=data['AnnualIncome'],
y=data['SpendingScore'],
hue=data['Cluster'],
palette='viridis',
s=100
)
plt.title('Customer Segments')
plt.xlabel('Annual Income')
plt.ylabel('Spending Score')
plt.legend(title='Cluster')
plt.show()

cluster_summary = data.groupby('Cluster').mean()
print(cluster_summary)