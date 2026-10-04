with open('src/components/MediaView.tsx', 'r') as f:
    content = f.read()

toolbar_start = content.find("      {/* View Mode & Sizing controls */}")
upload_start = content.find('      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">')
content_area = content.find("      {/* Content Area */}")

print(f"Toolbar: {toolbar_start}, Upload: {upload_start}, Content: {content_area}")

if toolbar_start != -1 and upload_start != -1 and content_area != -1:
    if toolbar_start < upload_start:
        print("Toolbar is above upload. Swapping...")
        toolbar_sec = content[toolbar_start:upload_start]
        upload_sec = content[upload_start:content_area]
        new_content = content[:toolbar_start] + upload_sec + toolbar_sec + content[content_area:]
    else:
        print("Upload is above toolbar. All good!")
        new_content = content
        
    with open('src/components/MediaView.tsx', 'w') as f:
        f.write(new_content)
