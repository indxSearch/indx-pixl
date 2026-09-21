using System.Collections.ObjectModel;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Indx.Api;
using Terminal.Gui.App;
using Terminal.Gui.Input;
using Terminal.Gui.ViewBase;
using Terminal.Gui.Views;

var repoRoot = FindRepoRoot();
var pixlPath = Path.Combine(repoRoot, "pixl.json");
var rawIconDir = Path.Combine(repoRoot, "raw-icons");
var library = PixlLibrary.Load(pixlPath, rawIconDir);
var search = new IndxIconSearch(library.Icons);

using IApplication app = Application.Create();
app.Init();

var icons = new ObservableCollection<IconEntry>(library.Icons);
var root = new Window
{
    Title = $"indx-pixl console - {library.SourceLabel}",
    X = 0,
    Y = 0,
    Width = Dim.Fill(),
    Height = Dim.Fill()
};

var logo = new IconPreviewView { X = 3, Y = 1, Icon = library.FindIcon("indx") };
var heading = new Label { X = Pos.Right(logo) + 3, Y = 1, Text = "indx pixl console" };
var sub = new Label { X = Pos.Left(heading), Y = 2, Text = "terminal workbench for drawing monochrome icons" };

var toolsFrame = new FrameView { Title = "Tools", X = 0, Y = 5, Width = 15, Height = Dim.Fill() };
var pencil = new Label { X = 1, Y = 1, Text = "[x] Pencil" };
var erase = new Label { X = 1, Y = 3, Text = "[ ] Erase" };
var mouseHint = new Label { X = 1, Y = 6, Width = Dim.Fill(1), Height = 5, Text = "Mouse:\nleft paint\nright erase" };
toolsFrame.Add(pencil, erase, mouseHint);

var layersFrame = new FrameView { Title = "Layers", X = Pos.Right(toolsFrame), Y = 5, Width = 33, Height = Dim.Fill() };
var searchLabel = new Label { Text = "Search", X = 1, Y = 0 };
var searchBox = new TextField { X = 1, Y = 1, Width = Dim.Fill(1), Height = 1, Text = "" };
var list = new ListView
{
    X = 1,
    Y = 3,
    Width = Dim.Fill(1),
    Height = Dim.Fill(1),
};
list.SetSource(icons);
layersFrame.Add(searchLabel, searchBox, list);

var canvasFrame = new FrameView { Title = "Canvas", X = Pos.Right(layersFrame), Y = 5, Width = Dim.Fill(31), Height = Dim.Fill() };
var editor = new PixelEditorView
{
    X = 1,
    Y = 1,
    Width = Dim.Fill(1),
    Height = Dim.Fill(1)
};
canvasFrame.Add(editor);

var inspectorFrame = new FrameView { Title = "Inspector", X = Pos.Right(canvasFrame), Y = 5, Width = 31, Height = Dim.Fill() };
var inspector = new Label { X = 1, Y = 1, Width = Dim.Fill(1), Height = 10, Text = "No selection" };
inspectorFrame.Add(inspector);

var status = new StatusBar(new[]
{
    new Shortcut(Key.F3, "Search", () => searchBox.SetFocus()),
    new Shortcut(Key.F4, "Canvas", () => editor.SetFocus()),
    new Shortcut(Key.S.WithCtrl, "Save", () => editor.Save()),
    new Shortcut(Key.Space, "Toggle", () => editor.ToggleCurrent()),
    new Shortcut(Key.F9, "Gallery", ShowGallery),
    new Shortcut(Key.Q.WithCtrl, "Quit", () => app.RequestStop()),
});

var menu = new MenuBar(new[]
{
    new MenuBarItem("_File", new[]
    {
        new MenuItem("_Save", "Save selected icon", () => editor.Save(), Key.S.WithCtrl),
        new MenuItem("_Quit", "Quit", () => app.RequestStop(), Key.Q.WithCtrl),
    }),
    new MenuBarItem("_Edit", new[]
    {
        new MenuItem("_Toggle pixel", "Toggle the pixel under the cursor", () => editor.ToggleCurrent(), Key.Space),
    }),
    new MenuBarItem("_View", new[]
    {
        new MenuItem("_Search", "Focus icon search", () => searchBox.SetFocus(), Key.F3),
        new MenuItem("_Canvas", "Focus pixel canvas", () => editor.SetFocus(), Key.F4),
        new MenuItem("_Gallery", "Open icon gallery", ShowGallery, Key.F9),
    })
});
menu.X = Pos.AnchorEnd(36);
menu.Y = 1;
menu.Width = 34;

void ShowGallery()
{
    var dialog = new Dialog { Title = $"indx pixl · {library.Icons.Count} icons", Width = Dim.Percent(90), Height = Dim.Percent(90) };
    var sheet = new GallerySheetView(library.Icons)
    {
        X = 0,
        Y = 0,
        Width = Dim.Fill(),
        Height = Dim.Fill(1),
        Selected = editor.Icon
    };
    sheet.IconAccepted += (_, icon) =>
    {
        SelectIcon(icon);
        app.RequestStop(dialog);
    };
    var close = new Button { Text = "Close", IsDefault = true };
    close.Accepting += (_, e) => { app.RequestStop(dialog); e.Handled = true; };
    dialog.Add(sheet);
    dialog.AddButton(close);
    app.Run(dialog);
    dialog.Dispose();
}

void SelectIcon(IconEntry? icon)
{
    if (icon is null) return;
    editor.Icon = icon;
    inspector.Text = $"Name      {icon.Name}\nArtboard  {icon.Artboard}\nSize      {icon.Width} x {icon.Height}\nPixels    {icon.OnPixelCount}\nSource    {library.SourceLabel}\n\nF4 focuses canvas\nClick/drag to paint";
    editor.SetNeedsDraw();
}

void RefreshList(IReadOnlyList<IconEntry> filtered)
{
    icons.Clear();
    foreach (var icon in filtered) icons.Add(icon);
    SelectIcon(icons.FirstOrDefault());
}

searchBox.ValueChanged += (_, _) =>
{
    var text = searchBox.Text?.ToString() ?? "";
    RefreshList(search.Find(text));
};

list.ValueChanged += (_, _) =>
{
    var index = list.SelectedItem ?? -1;
    if (index >= 0 && index < icons.Count) SelectIcon(icons[index]);
};

editor.Saved += (_, icon) =>
{
    if (library.SaveIcon(icon, pixlPath))
    {
        inspector.Text = $"Saved {icon.Name}\n\nName      {icon.Name}\nArtboard  {icon.Artboard}\nSize      {icon.Width} x {icon.Height}\nPixels    {icon.OnPixelCount}";
    }
    else
    {
        inspector.Text = "Loaded from raw-icons; editing is preview-only until pixl.json exists.";
    }
};

root.KeyDown += (_, key) =>
{
    if (key == Key.Esc)
    {
        Application.RequestStop();
        key.Handled = true;
    }
    else if (key == Key.S.WithCtrl)
    {
        editor.Save();
        key.Handled = true;
    }
    else if (key == '/')
    {
        searchBox.SetFocus();
        key.Handled = true;
    }
};

root.Add(logo, heading, sub, menu, toolsFrame, layersFrame, canvasFrame, inspectorFrame);
root.Add(status);
SelectIcon(icons.FirstOrDefault());
app.Run(root);

static string FindRepoRoot()
{
    var dir = Directory.GetCurrentDirectory();
    while (!string.IsNullOrWhiteSpace(dir))
    {
        if (File.Exists(Path.Combine(dir, "pixl.json")) || Directory.Exists(Path.Combine(dir, "raw-icons"))) return dir;
        var parent = Directory.GetParent(dir)?.FullName;
        if (parent == dir || parent is null) break;
        dir = parent;
    }

    var fromBinary = AppContext.BaseDirectory;
    dir = fromBinary;
    while (!string.IsNullOrWhiteSpace(dir))
    {
        if (File.Exists(Path.Combine(dir, "pixl.json")) || Directory.Exists(Path.Combine(dir, "raw-icons"))) return dir;
        var parent = Directory.GetParent(dir)?.FullName;
        if (parent == dir || parent is null) break;
        dir = parent;
    }

    return Directory.GetCurrentDirectory();
}

sealed class IconPreviewView : View
{
    public IconPreviewView()
    {
        Width = 7;
        Height = 3;
        CanFocus = false;
    }

    public IconEntry? Icon { get; set; }

    protected override bool OnDrawingContent(DrawContext? context)
    {
        for (var row = 0; row < 3; row++)
        {
            Move(0, row);
            AddStr(Icon is null ? new string(' ', 7) : IconText.Row(Icon, row));
        }
        return true;
    }
}

static class IconText
{
    public static int Rows(IconEntry icon) => (icon.Height + 1) / 2;

    public static string Row(IconEntry icon, int row)
    {
        Span<char> line = stackalloc char[Math.Min(icon.Width, 14)];
        for (var x = 0; x < line.Length; x++)
        {
            var top = row * 2 < icon.Height && icon.Pixels[x, row * 2];
            var bottom = row * 2 + 1 < icon.Height && icon.Pixels[x, row * 2 + 1];
            line[x] = (top, bottom) switch { (true, true) => '█', (true, false) => '▀', (false, true) => '▄', _ => ' ' };
        }
        return new string(line);
    }
}

sealed class PixelEditorView : View
{
    private IconEntry? icon;
    private int cursorX;
    private int cursorY;

    public event EventHandler<IconEntry>? Saved;

    public PixelEditorView()
    {
        Title = "Editor";
        CanFocus = true;
        MouseEvent += OnMouse;
    }

    public IconEntry? Icon
    {
        get => icon;
        set
        {
            icon = value;
            cursorX = 0;
            cursorY = 0;
            SetNeedsDraw();
        }
    }

    protected override bool OnDrawingContent(DrawContext? context)
    {
        var current = icon;
        var normal = GetAttributeForRole(Terminal.Gui.Drawing.VisualRole.Normal);
        var inverted = new Terminal.Gui.Drawing.Attribute(Terminal.Gui.Drawing.StandardColor.Black, Terminal.Gui.Drawing.StandardColor.White);

        SetAttribute(normal);
        Move(0, 0);
        AddStr("Pixel canvas".PadRight(Math.Max(0, Viewport.Width)));
        if (current is null)
        {
            Move(0, 2);
            AddStr("No icon selected.");
            SetAttribute(normal);
            return true;
        }

        Move(0, 1);
        AddStr($"{current.Name}  ·  {current.Width}x{current.Height}  ·  click/drag to edit".PadRight(Math.Max(0, Viewport.Width)));

        const int originX = 4, originY = 4;
        SetAttribute(inverted);
        FillInvertedDrawingArea(originX, originY, current.Width * 2, current.Height);
        for (var y = 0; y < current.Height; y++)
        {
            Move(originX, originY + y);
            var line = new StringBuilder();
            for (var x = 0; x < current.Width; x++)
            {
                if (x == cursorX && y == cursorY) line.Append(current.Pixels[x, y] ? "▓▓" : "░░");
                else line.Append(current.Pixels[x, y] ? "██" : "  ");
            }
            AddStr(line.ToString());
        }

        SetAttribute(normal);
        var previewY = originY + current.Height + 2;
        Move(originX, previewY);
        AddStr("Preview");
        for (var row = 0; row < IconText.Rows(current); row++)
        {
            Move(originX, previewY + row + 1);
            AddStr(IconText.Row(current, row));
        }

        Move(originX, previewY + IconText.Rows(current) + 2);
        AddStr("left: paint · right: erase · Space: toggle · S: save".PadRight(Math.Max(0, Viewport.Width - originX)));
        SetAttribute(normal);
        return true;
    }

    private void FillInvertedDrawingArea(int x, int y, int width, int height)
    {
        var left = Math.Max(0, x - 1);
        var top = Math.Max(0, y - 1);
        var right = Math.Min(Math.Max(0, Viewport.Width), x + width + 1);
        var bottom = Math.Min(Math.Max(0, Viewport.Height), y + height + 1);
        var blank = new string(' ', Math.Max(0, right - left));
        for (var yy = top; yy < bottom; yy++)
        {
            Move(left, yy);
            AddStr(blank);
        }
    }

    public void ToggleCurrent()
    {
        if (icon is null) return;
        icon.Pixels[cursorX, cursorY] = !icon.Pixels[cursorX, cursorY];
        SetNeedsDraw();
    }

    public void Save()
    {
        if (icon is null) return;
        Saved?.Invoke(this, icon);
    }

    private void OnMouse(object? sender, Mouse mouse)
    {
        if (icon is null) return;
        if (!TryMouseToPixel(mouse, out var x, out var y)) return;

        cursorX = x;
        cursorY = y;
        if (mouse.Flags.HasFlag(MouseFlags.RightButtonClicked) || mouse.Flags.HasFlag(MouseFlags.RightButtonPressed))
        {
            icon.Pixels[x, y] = false;
            mouse.Handled = true;
        }
        else if (mouse.Flags.HasFlag(MouseFlags.LeftButtonClicked) || mouse.Flags.HasFlag(MouseFlags.LeftButtonPressed))
        {
            icon.Pixels[x, y] = true;
            mouse.Handled = true;
        }
        else
        {
            mouse.Handled = true;
        }
        SetFocus();
        SetNeedsDraw();
    }

    private bool TryMouseToPixel(Mouse mouse, out int x, out int y)
    {
        const int originX = 4, originY = 4, cellW = 2;
        x = 0;
        y = 0;
        if (mouse.Position is not { } point) return false;
        x = (point.X - originX) / cellW;
        y = point.Y - originY;
        return icon is not null && x >= 0 && x < icon.Width && y >= 0 && y < icon.Height;
    }

    protected override bool OnKeyDown(Key key)
    {
        if (icon is null) return base.OnKeyDown(key);

        if (key == Key.CursorLeft) cursorX = Math.Max(0, cursorX - 1);
        else if (key == Key.CursorRight) cursorX = Math.Min(icon.Width - 1, cursorX + 1);
        else if (key == Key.CursorUp) cursorY = Math.Max(0, cursorY - 1);
        else if (key == Key.CursorDown) cursorY = Math.Min(icon.Height - 1, cursorY + 1);
        else if (key == Key.Space || key == Key.Enter) ToggleCurrent();
        else if (key == Key.S || key == Key.S.WithCtrl) Save();
        else return base.OnKeyDown(key);

        key.Handled = true;
        SetNeedsDraw();
        return true;
    }
}

sealed class GallerySheetView : View
{
    private readonly IReadOnlyList<IconEntry> icons;

    public GallerySheetView(IReadOnlyList<IconEntry> icons)
    {
        this.icons = icons;
        Title = "Gallery";
        CanFocus = true;
        MouseEvent += OnMouse;
    }

    public event EventHandler<IconEntry>? IconAccepted;
    public IconEntry? Selected { get; set; }

    protected override bool OnDrawingContent(DrawContext? context)
    {
        const int cellWidth = 22, cellHeight = 4;
        var cols = Math.Max(1, Math.Max(1, Viewport.Width) / cellWidth);
        for (var i = 0; i < icons.Count; i++)
        {
            var icon = icons[i];
            var col = i % cols;
            var row = i / cols;
            var x0 = col * cellWidth;
            var y0 = row * cellHeight;
            if (y0 >= Viewport.Height) break;
            Move(x0, y0);
            AddStr(ReferenceEquals(icon, Selected) ? ">" : " ");
            for (var y = 0; y < IconText.Rows(icon) && y0 + y < Viewport.Height; y++)
            {
                Move(x0 + 1, y0 + y);
                AddStr(IconText.Row(icon, y));
            }
            Move(x0 + 9, y0 + 1);
            AddStr(icon.Name[..Math.Min(icon.Name.Length, Math.Max(0, cellWidth - 10))]);
        }
        return true;
    }

    private void OnMouse(object? sender, Mouse mouse)
    {
        if (mouse.Position is not { } point) return;
        const int cellWidth = 22, cellHeight = 4;
        var cols = Math.Max(1, Math.Max(1, Viewport.Width) / cellWidth);
        var index = Math.Max(0, point.Y) / cellHeight * cols + Math.Max(0, point.X) / cellWidth;
        if (index < 0 || index >= icons.Count) return;
        Selected = icons[index];
        SetNeedsDraw();
        if (mouse.IsDoubleClicked || mouse.Flags.HasFlag(MouseFlags.LeftButtonClicked))
        {
            IconAccepted?.Invoke(this, icons[index]);
            mouse.Handled = true;
        }
    }

    protected override bool OnKeyDown(Key key)
    {
        if (key == Key.Enter && Selected is { } selected)
        {
            IconAccepted?.Invoke(this, selected);
            key.Handled = true;
            return true;
        }
        return base.OnKeyDown(key);
    }
}

sealed class IndxIconSearch : IDisposable
{
    private readonly SearchEngine engine = new();
    private readonly Dictionary<long, IconEntry> byKey = new();
    private readonly IReadOnlyList<IconEntry> all;
    private readonly bool ready;

    public IndxIconSearch(IReadOnlyList<IconEntry> icons)
    {
        all = icons;

        try
        {
            var docs = icons.Select((icon, i) => new
            {
                id = (i + 1).ToString(),
                name = icon.Name,
                artboard = icon.Artboard,
                text = icon.Name + " " + icon.Artboard
            }).ToArray();
            var json = JsonSerializer.Serialize(docs);
            using var init = new MemoryStream(Encoding.UTF8.GetBytes(json));
            using var load = new MemoryStream(Encoding.UTF8.GetBytes(json));
            engine.Init(init);

            var fields = engine.GetFieldConfiguration();
            var configuration = fields
                .Where(field => field.FieldName is "name" or "artboard" or "text")
                .Select(field => new FieldProxy
                {
                    FieldName = field.FieldName,
                    Searchable = true,
                    Weight = field.FieldName == "name" ? 2.0f : 1.0f,
                    HighResolution = true
                })
                .ToArray();

            ready = configuration.Length > 0 && engine.SetFieldConfiguration(configuration) is null;
            if (!ready) return;

            engine.Load(load);
            engine.Index();
            foreach (var icon in icons.Select((value, index) => (value, key: (long)index + 1))) byKey[icon.key] = icon.value;
        }
        catch
        {
            ready = false;
        }
    }

    public IReadOnlyList<IconEntry> Find(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return all;

        if (ready)
        {
            var result = engine.Search(new Query(text, 250));
            var matches = result.Records
                .Select(record => byKey.TryGetValue(record.DocumentKey, out var icon) ? icon : null)
                .Where(x => x is not null)
                .Cast<IconEntry>()
                .ToList();
            if (matches.Count > 0) return matches;
        }

        return all.Where(icon =>
            icon.Name.Contains(text, StringComparison.OrdinalIgnoreCase) ||
            icon.Artboard.Contains(text, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    public void Dispose() => engine.Dispose();
}

sealed class PixlLibrary
{
    private readonly JsonNode? document;

    private PixlLibrary(string sourceLabel, List<IconEntry> icons, JsonNode? document)
    {
        SourceLabel = sourceLabel;
        Icons = icons;
        this.document = document;
    }

    public string SourceLabel { get; }
    public List<IconEntry> Icons { get; }
    public IconEntry? FindIcon(string name) => Icons.FirstOrDefault(icon => string.Equals(icon.Name, name, StringComparison.OrdinalIgnoreCase));

    public static PixlLibrary Load(string pixlPath, string rawIconDir)
    {
        if (File.Exists(pixlPath)) return LoadPixl(pixlPath);
        return LoadRawIcons(rawIconDir);
    }

    private static PixlLibrary LoadPixl(string pixlPath)
    {
        var node = JsonNode.Parse(File.ReadAllText(pixlPath))!;
        var icons = new List<IconEntry>();
        foreach (var artboard in node["artboards"]!.AsArray().OfType<JsonObject>())
        {
            var artboardName = artboard["name"]?.GetValue<string>() ?? "Artboard";
            foreach (var icon in artboard["icons"]?.AsArray().OfType<JsonObject>() ?? Enumerable.Empty<JsonObject>())
            {
                var entry = IconEntry.FromJson(icon, artboardName);
                icons.Add(entry);
            }
        }
        return new PixlLibrary("pixl.json", icons.OrderBy(i => i.Artboard).ThenBy(i => i.Name).ToList(), node);
    }

    private static PixlLibrary LoadRawIcons(string rawIconDir)
    {
        var icons = new List<IconEntry>();
        foreach (var file in Directory.Exists(rawIconDir) ? Directory.EnumerateFiles(rawIconDir, "*.svg") : Enumerable.Empty<string>())
        {
            var text = File.ReadAllText(file);
            var width = TryInt(Regex.Match(text, "width=\"(\\d+)\"").Groups[1].Value, 7);
            var height = TryInt(Regex.Match(text, "height=\"(\\d+)\"").Groups[1].Value, 5);
            var pixels = new bool[width, height];
            foreach (Match m in Regex.Matches(text, "<rect[^>]*x=\"(\\d+)\"[^>]*y=\"(\\d+)\"[^>]*width=\"(\\d+)\"[^>]*height=\"(\\d+)\""))
            {
                var x = TryInt(m.Groups[1].Value, 0);
                var y = TryInt(m.Groups[2].Value, 0);
                var w = TryInt(m.Groups[3].Value, 1);
                var h = TryInt(m.Groups[4].Value, 1);
                for (var yy = y; yy < y + h && yy < height; yy++)
                for (var xx = x; xx < x + w && xx < width; xx++)
                    pixels[xx, yy] = true;
            }
            icons.Add(new IconEntry(Path.GetFileNameWithoutExtension(file), "raw-icons", width, height, pixels, null));
        }
        return new PixlLibrary("raw-icons", icons.OrderBy(i => i.Name).ToList(), null);
    }

    public bool SaveIcon(IconEntry icon, string pixlPath)
    {
        if (document is null || icon.Json is null) return false;
        var rects = new JsonArray();
        for (var y = 0; y < icon.Height; y++)
        for (var x = 0; x < icon.Width; x++)
        {
            if (!icon.Pixels[x, y]) continue;
            rects.Add(new JsonObject
            {
                ["id"] = $"console-{x}-{y}",
                ["x"] = x,
                ["y"] = y,
                ["w"] = 1,
                ["h"] = 1,
                ["fill"] = "lv8"
            });
        }
        icon.Json["rects"] = rects;
        File.WriteAllText(pixlPath, document.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
        return true;
    }

    private static int TryInt(string value, int fallback) => int.TryParse(value, out var result) ? result : fallback;
}

sealed class IconEntry
{
    public IconEntry(string name, string artboard, int width, int height, bool[,] pixels, JsonObject? json)
    {
        Name = name;
        Artboard = artboard;
        Width = width;
        Height = height;
        Pixels = pixels;
        Json = json;
    }

    public string Name { get; }
    public string Artboard { get; }
    public int Width { get; }
    public int Height { get; }
    public bool[,] Pixels { get; }
    public JsonObject? Json { get; }
    public int OnPixelCount
    {
        get
        {
            var count = 0;
            for (var y = 0; y < Height; y++)
            for (var x = 0; x < Width; x++)
                if (Pixels[x, y]) count++;
            return count;
        }
    }

    public static IconEntry FromJson(JsonObject icon, string artboard)
    {
        var name = icon["name"]?.GetValue<string>() ?? "icon";
        var width = icon["w"]?.GetValue<int>() ?? 7;
        var height = icon["h"]?.GetValue<int>() ?? 5;
        var pixels = new bool[width, height];
        foreach (var rect in icon["rects"]?.AsArray().OfType<JsonObject>() ?? Enumerable.Empty<JsonObject>())
        {
            var x = rect["x"]?.GetValue<int>() ?? 0;
            var y = rect["y"]?.GetValue<int>() ?? 0;
            var w = rect["w"]?.GetValue<int>() ?? 1;
            var h = rect["h"]?.GetValue<int>() ?? 1;
            for (var yy = y; yy < y + h && yy < height; yy++)
            for (var xx = x; xx < x + w && xx < width; xx++)
                if (xx >= 0 && yy >= 0) pixels[xx, yy] = true;
        }
        return new IconEntry(name, artboard, width, height, pixels, icon);
    }

    public override string ToString() => $"{Name} [{Artboard}]";
}
